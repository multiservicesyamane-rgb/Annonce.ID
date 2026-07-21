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

// Interrupteurs système pilotés depuis l'admin (Paramètres → Toggles).
// Défauts « ouverts » pour ne jamais bloquer le site par accident.
export type SiteFlags = { maintenance: boolean; signups: boolean; payments: boolean };
const DEFAULT_FLAGS: SiteFlags = { maintenance: false, signups: true, payments: true };

function readFlags(data: any): SiteFlags {
  const t = (data && data.toggles) || {};
  return {
    maintenance: t["Mode maintenance"] === true,
    signups: t["Inscriptions ouvertes"] !== false,
    payments: t["Paiements actifs"] !== false,
  };
}

// Lecture PUBLIQUE : prix admin + offres payables en ligne + état des toggles.
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ prices: {}, online: onlineOfferKeys(), flags: DEFAULT_FLAGS });
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await sb.from("app_settings").select("data").eq("id", "global").maybeSingle();
    const d = (data?.data as any) || {};
    return NextResponse.json({ prices: d.prices || {}, online: onlineOfferKeys(), flags: readFlags(d) });
  } catch {
    return NextResponse.json({ prices: {}, online: onlineOfferKeys(), flags: DEFAULT_FLAGS });
  }
}
