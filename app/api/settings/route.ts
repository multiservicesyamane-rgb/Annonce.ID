import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Offres payables EN LIGNE = celles reliées à un produit Chariow.
// On n'expose que les CLÉS d'offre (boost:premium, sub:standard:general…),
// jamais les identifiants produits.
function onlineOfferKeys(): string[] {
  let keys: string[] = [];
  try {
    keys = Object.keys(JSON.parse(process.env.CHARIOW_PRODUCTS || "{}"));
  } catch { /* JSON invalide → aucune offre en ligne */ }
  if (process.env.CHARIOW_PRODUCT_DEFAULT && !keys.includes("default")) keys.push("default");
  return keys;
}

// Lecture PUBLIQUE des prix configurés dans l'admin (app_settings.global.prices)
// + liste des offres payables en ligne. Sert à la page de paiement.
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ prices: {}, online: onlineOfferKeys() });
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await sb.from("app_settings").select("data").eq("id", "global").maybeSingle();
    return NextResponse.json({ prices: (data?.data as any)?.prices || {}, online: onlineOfferKeys() });
  } catch {
    return NextResponse.json({ prices: {}, online: onlineOfferKeys() });
  }
}
