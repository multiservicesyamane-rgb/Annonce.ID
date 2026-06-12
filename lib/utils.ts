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
