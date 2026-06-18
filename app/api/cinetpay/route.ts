import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.trim().replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  try {
    const API_KEY = process.env.CINETPAY_API_KEY;
    const SITE_ID = process.env.CINETPAY_SITE_ID;
    if (!API_KEY || !SITE_ID) {
      return NextResponse.json({ error: "CinetPay non configuré (CINETPAY_API_KEY / CINETPAY_SITE_ID manquantes)." }, { status: 500 });
    }

    // Auth : seul un utilisateur connecté peut payer
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Non autorisé. Veuillez vous connecter." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { amount, itemName, listingId, boostKey, subKey } = body;
    if (typeof amount !== "number" || amount <= 0 || amount > 10000000) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }

    // XOF : le montant doit être un multiple de 5
    const xof = Math.max(5, Math.round(amount / 5) * 5);
    const baseUrl = getBaseUrl(req);
    // CinetPay exige des URLs HTTPS publiques ; en dev on bascule sur le domaine prod
    const PROD = (process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com").replace(/\/+$/, "");
    const publicBase = baseUrl.startsWith("https://") ? baseUrl : PROD;
    const transactionId = `WMK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      apikey: API_KEY,
      site_id: SITE_ID,
      transaction_id: transactionId,
      amount: xof,
      currency: "XOF",
      description: (itemName || "Paiement Wanteermako").slice(0, 100),
      notify_url: `${publicBase}/api/cinetpay/notify`,
      return_url: `${publicBase}/paiement/succes` + (listingId ? `?listing_id=${listingId}` : ""),
      channels: "ALL",
      lang: "fr",
      metadata: JSON.stringify({ userId: user.id, listingId: listingId || "", boostKey: boostKey || "", subKey: subKey || "" }),
    };

    const res = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data?.code === "201" && data?.data?.payment_url) {
      return NextResponse.json({ redirect_url: data.data.payment_url });
    }
    console.error("CinetPay error:", data);
    return NextResponse.json({ error: `CinetPay a refusé: ${data?.message || data?.description || "erreur"}` }, { status: 400 });
  } catch (error: any) {
    console.error("CinetPay API Error:", error);
    return NextResponse.json({ error: `Erreur interne: ${error?.message}` }, { status: 500 });
  }
}
