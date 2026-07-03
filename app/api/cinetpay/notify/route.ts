import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishOneListing } from "@/lib/campaign-engine";

export const dynamic = "force-dynamic";

// CinetPay appelle cette URL après paiement. On vérifie la transaction côté
// serveur (API check) puis on enregistre l'achat et on active le boost.
export async function POST(req: Request) {
  try {
    const API_KEY = process.env.CINETPAY_API_KEY;
    const SITE_ID = process.env.CINETPAY_SITE_ID;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY || !SITE_ID || !supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Config manquante" }, { status: 500 });
    }

    // CinetPay envoie cpm_trans_id (form-urlencoded)
    const text = await req.text();
    const params = new URLSearchParams(text);
    const transactionId = params.get("cpm_trans_id") || params.get("transaction_id");
    if (!transactionId) return NextResponse.json({ error: "transaction_id manquant" }, { status: 400 });

    // Vérification serveur-à-serveur
    const checkRes = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ apikey: API_KEY, site_id: SITE_ID, transaction_id: transactionId }),
    });
    const check = await checkRes.json();

    if (check?.data?.status !== "ACCEPTED") {
      return NextResponse.json({ success: false, status: check?.data?.status || "PENDING" });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    let meta: any = {};
    try { meta = JSON.parse(check.data.metadata || "{}"); } catch { /* ignore */ }
    const { userId, listingId, boostKey } = meta;
    const amount = parseInt(check.data.amount || "0", 10);

    if (userId || listingId) {
      await supabase.from("purchases").insert({
        user_id: userId || null,
        amount,
        ref_command: transactionId,
        status: "success",
        type: listingId ? "boost" : "credits",
      });
      if (listingId) {
        const premium = boostKey === "premium" || boostKey === "vip" || !boostKey;
        const featured = boostKey === "alaune" || boostKey === "vip";
        await supabase.from("listings").update({
          status: "active",
          premium,
          featured,
          is_premium: premium,
          is_featured: featured,
          boost_key: boostKey || null,
        }).eq("id", listingId);
        // Publication instantanée sur les réseaux (idempotent).
        try { await publishOneListing(supabase, listingId); } catch (e) { console.warn("publishOneListing:", e); }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CinetPay notify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
