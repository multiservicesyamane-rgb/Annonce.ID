import { CATEGORIES } from "./constants";

/** Slugifie un titre pour les URLs propres : /annonce/[id]/[slug] */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Formate un nombre avec séparateurs (fr-FR). */
export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number(value.replace(/\D/g, "")) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("fr-FR");
}

export function categorySlugFromName(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.slug ?? slugify(name);
}

// Séquence emoji (pictogramme + éventuels ZWJ ‍ / sélecteur de variante ️ / tons de peau).
const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*[️\u{1F3FB}-\u{1F3FF}]*/gu;

/**
 * Limite le nombre d'emojis AFFICHÉS dans un titre (défaut : 1).
 * N'altère pas la donnée en base : purement cosmétique au rendu.
 * "iPhone 13 🔥🔥🔥 Promo 🎉" → "iPhone 13 🔥 Promo"
 */
export function limitEmojis(text: string, max = 1): string {
  if (!text) return text;
  let seen = 0;
  return text
    .replace(EMOJI_SEQUENCE, (m) => (++seen <= max ? m : ""))
    .replace(/\s{2,}/g, " ")
    .trim();
}
