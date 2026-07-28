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

// Accroches marketing en tête de titre à retirer pour le SEO (suivies d'un séparateur).
const SEO_LEADIN =
  /^(?:bonne affaire|super affaire|top affaire|à saisir|a saisir|à ne pas rater|a ne pas rater|promo(?:tion)?|offre(?: du moment)?|urgent|deal|vente flash|d[ée]stockage)\s*[:\-–—]\s*/i;

/**
 * Nettoie un titre pour le SEO : retire TOUS les emojis et une éventuelle
 * accroche marketing en tête ("💥 Bonne affaire : iPhone" → "iPhone").
 * N'altère pas la base : à utiliser au rendu / dans les métadonnées.
 */
export function cleanTitleForSeo(text: string): string {
  if (!text) return "";
  let t = text.replace(EMOJI_SEQUENCE, " ").replace(/\s{2,}/g, " ").trim();
  t = t.replace(/^[\s:|·•–—-]+/, "").trim();
  t = t.replace(SEO_LEADIN, "").trim();
  t = t.replace(/^[\s:|·•–—-]+/, "").trim();
  return t || text.trim();
}

/** <title> SEO : "{Titre propre} — {Prix} à {Lieu} | Wanteermako", visé ~60 caractères. */
export function buildListingSeoTitle(rawTitle: string, price?: string, location?: string): string {
  const clean = cleanTitleForSeo(rawTitle);
  const brand = " | Wanteermako";
  const MAX = 60;
  const showPrice = !!price && !/^0(\s|$)/.test(price) && !/gratuit/i.test(price);
  let core = clean;
  if (showPrice) core += ` — ${price}`;
  if (location) core += ` à ${location}`;
  const full = core + brand;
  if (full.length <= MAX) return full;
  if (core.length <= MAX) return core;
  return core.slice(0, MAX - 1).replace(/\s+\S*$/, "").trim() + "…";
}

/**
 * Nettoie un titre pour l'AFFICHAGE et la PUBLICATION : retire les emojis et
 * accroches marketing EN TÊTE de chaîne, mais garde les emojis internes voulus.
 * "🔥 iPhone 13 🔋" → "iPhone 13 🔋" · "💥 Bonne affaire : Kia" → "Kia"
 */
export function tidyTitle(text: string): string {
  if (!text) return text;
  const LEAD = /^(?:[\s:|·•–—-]|\p{Extended_Pictographic}[️\u{1F3FB}-\u{1F3FF}‍]*)+/u;
  let t = text.replace(/\s{2,}/g, " ").trim();
  t = t.replace(LEAD, "").trim();
  t = t.replace(SEO_LEADIN, "").trim();
  t = t.replace(LEAD, "").trim();
  return t || text.trim();
}

/** Meta description SEO : ~150-158 caractères, sans emoji, riche en mots-clés. */
export function buildListingSeoDescription(p: {
  title: string;
  price?: string;
  category?: string;
  location?: string;
  description?: string;
}): string {
  const clean = cleanTitleForSeo(p.title);
  const showPrice = !!p.price && !/^0(\s|$)/.test(p.price) && !/gratuit/i.test(p.price);
  const lead = `${clean}${showPrice ? ` — ${p.price}` : ""}${p.location ? ` à ${p.location}` : ""}.`;
  const cat = p.category ? ` ${p.category} sur Wanteermako.` : " Petite annonce sur Wanteermako.";
  const descClean = (p.description || "").replace(EMOJI_SEQUENCE, " ").replace(/\s{2,}/g, " ").trim();
  let out = (lead + cat + (descClean ? " " + descClean : "")).replace(/\s{2,}/g, " ").trim();
  if (out.length > 158) out = out.slice(0, 157).replace(/\s+\S*$/, "").trim() + "…";
  return out;
}
