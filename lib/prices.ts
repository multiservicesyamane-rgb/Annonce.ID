// Prix dynamiques : les vrais plans sont définis dans lib/constants.ts (BOOSTS,
// SUBSCRIPTION_PLANS) mais l'admin peut OVERRIDE les prix depuis Paramètres.
// Les overrides sont stockés dans app_settings.global.prices et lus via /api/settings.
//
// Conventions de clés :
//   boost:<key>            ex: boost:premium
//   sub:<category>:<key>   ex: sub:vehicules:vip

export type PriceMap = Record<string, number>;

export const boostPriceKey = (key: string) => `boost:${key}`;
export const subPriceKey = (cat: string, key: string) => `sub:${cat}:${key}`;

/** Récupère les overrides de prix configurés dans l'admin (vide si non configuré). */
export async function fetchPrices(): Promise<PriceMap> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const d = await res.json();
    return (d?.prices as PriceMap) || {};
  } catch {
    return {};
  }
}

/** Prix effectif = override admin s'il existe, sinon prix par défaut du code. */
export function effectivePrice(prices: PriceMap, key: string, fallback: number): number {
  const v = prices[key];
  return typeof v === "number" && v >= 0 ? v : fallback;
}
