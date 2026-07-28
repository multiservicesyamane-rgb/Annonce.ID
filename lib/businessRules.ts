export const FREE_LISTING_LIMIT = 2;

export const LISTING_STATUSES = [
  "active",
  "inactive",
  "pending",
  "rejected",
  "draft",
  "expired",
  "sold",
  "suspended",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

const LISTING_STATUS_SET = new Set<string>(LISTING_STATUSES);

export function isListingStatus(value: unknown): value is ListingStatus {
  return typeof value === "string" && LISTING_STATUS_SET.has(value);
}

export function normalizeListingStatus(value: unknown): ListingStatus {
  return isListingStatus(value) ? value : "active";
}

export function normalizeFreeAdsRemaining(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return FREE_LISTING_LIMIT;
  return Math.max(0, Math.min(FREE_LISTING_LIMIT, Math.trunc(parsed)));
}

export function isPaidBoostKey(boostKey: unknown): boolean {
  return typeof boostKey === "string" && boostKey.trim() !== "" && boostKey !== "gratuit";
}

// Prix minimum cohérent par catégorie — bloque le spam à 1 FCFA. Le prix 0
// (annonce « Gratuit ») et « Sur devis » restent autorisés (gérés à part).
const MIN_PRICE_BY_CATEGORY: Record<string, number> = {
  vehicules: 100000,
  immobilier: 20000,
  "equipements-pro": 5000,
  entreprises: 5000,
  electronique: 1000,
};

export function minPriceForCategory(categorySlug: unknown): number {
  const slug = String(categorySlug || "").toLowerCase();
  return MIN_PRICE_BY_CATEGORY[slug] ?? 500;
}

export function freeAdsForSubscription(subKey: unknown): number {
  if (subKey === "standard") return 5;
  if (subKey === "premium") return 15;
  if (subKey === "vip") return 50;
  return FREE_LISTING_LIMIT;
}
