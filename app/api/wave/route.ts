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

// Paiement Wave (API Wave Business — Checkout). Crée une session et renvoie
// l'URL de paiement Wave. Frais réduits ~1 %.
export async function POST(req: Request) {
  try {
    const API_KEY = process.env.WAVE_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "Wave non configuré (WAVE_API_KEY manquante)." }, { status: 500 });
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

    // XOF : montant entier, multiple de 5
    const xof = Math.max(5, Math.round(amount / 5) * 5);
    const baseUrl = getBaseUrl(req);
    // Wave exige des URLs HTTPS publiques ; en dev on bascule sur le domaine prod
    const PROD = (process.env.NEXT_PUBLIC_APP_URL || "https://wanteermako.com").replace(/\/+$/, "");
    const publicBase = baseUrl.startsWith("https://") ? baseUrl : PROD;

    // On encode les infos de la commande dans client_reference (relu au webhook)
    const clientRef = [user.id, listingId || "", boostKey || "", subKey || ""].join("|").slice(0, 250);

    const payload = {
      amount: String(xof),
      currency: "XOF",
      success_url: `${publicBase}/paiement/succes` + (listingId ? `?listing_id=${listingId}` : ""),
      error_url: `${publicBase}/paiement/echec`,
      client_reference: clientRef,
    };

    const res = await fetch("https://api.wave.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data?.wave_launch_url) {
      return NextResponse.json({ redirect_url: data.wave_launch_url });
    }
    console.error("Wave error:", data);
    const msg = data?.message || data?.error_message || data?.code || "erreur";
    return NextResponse.json({ error: `Wave a refusé: ${msg}` }, { status: 400 });
  } catch (error: any) {
    console.error("Wave API Error:", error);
    return NextResponse.json({ error: `Erreur interne: ${error?.message}` }, { status: 500 });
  }
}
