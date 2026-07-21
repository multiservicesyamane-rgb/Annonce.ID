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

export type SiteFlags = { maintenance: boolean; signups: boolean; payments: boolean };
const DEFAULT_FLAGS: SiteFlags = { maintenance: false, signups: true, payments: true };

/** Prix admin + offres payables en ligne + interrupteurs système (toggles admin). */
export async function fetchPublicSettings(): Promise<{ prices: PriceMap; online: string[]; flags: SiteFlags }> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const d = await res.json();
    return {
      prices: (d?.prices as PriceMap) || {},
      online: Array.isArray(d?.online) ? d.online : [],
      flags: { ...DEFAULT_FLAGS, ...(d?.flags || {}) },
    };
  } catch {
    return { prices: {}, online: [], flags: DEFAULT_FLAGS };
  }
}

/** Récupère les overrides de prix configurés dans l'admin (vide si non configuré). */
export async function fetchPrices(): Promise<PriceMap> {
  return (await fetchPublicSettings()).prices;
}

/** Une offre est payable en ligne si elle est reliée à un produit Chariow.
 *  Mêmes clés de résolution que le serveur (app/api/chariow/route.ts). */
export function isOnlinePayable(
  online: string[],
  offer: { boostKey?: string; subKey?: string; category?: string }
): boolean {
  if (online.includes("default")) return true;
  if (offer.boostKey) return online.includes(`boost:${offer.boostKey}`);
  if (offer.subKey) {
    return (
      (!!offer.category && online.includes(`sub:${offer.subKey}:${offer.category}`)) ||
      online.includes(`sub:${offer.subKey}`)
    );
  }
  return false;
}

/** Prix effectif = override admin s'il existe, sinon prix par défaut du code. */
export function effectivePrice(prices: PriceMap, key: string, fallback: number): number {
  const v = prices[key];
  return typeof v === "number" && v >= 0 ? v : fallback;
}
