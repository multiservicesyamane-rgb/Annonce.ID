import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Wave appelle cette URL après un paiement (événement checkout.session.completed).
// On vérifie la signature (si secret configuré), puis on confirme le statut côté
// serveur en relisant la session, et on active le boost.
export async function POST(req: Request) {
  try {
    const API_KEY = process.env.WAVE_API_KEY;
    const WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!API_KEY || !supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Config manquante" }, { status: 500 });
    }

    const raw = await req.text();

    // Vérification de la signature Wave : header "Wave-Signature: t=...,v1=..."
    if (WEBHOOK_SECRET) {
      const sigHeader = req.headers.get("wave-signature") || "";
      const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=").map((s) => s.trim())));
      const t = parts["t"];
      const v1 = parts["v1"];
      if (!t || !v1) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
      const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${t}${raw}`).digest("hex");
      const ok = v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
      if (!ok) return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const event = JSON.parse(raw || "{}");
    const sessionId = event?.data?.id || event?.id;
    if (!sessionId) return NextResponse.json({ error: "Session manquante" }, { status: 400 });

    // Confirmation serveur-à-serveur : relire la session
    const checkRes = await fetch(`https://api.wave.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" },
    });
    const session = await checkRes.json();

    if (session?.payment_status !== "succeeded") {
      return NextResponse.json({ success: false, status: session?.payment_status || "pending" });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const [userId, listingId, boostKey] = String(session.client_reference || "").split("|");
    const amount = parseInt(session.amount || "0", 10);

    if (userId || listingId) {
      await supabase.from("purchases").insert({
        user_id: userId || null,
        amount,
        ref_command: sessionId,
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
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Wave webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
