import { BRAND } from "@/lib/constants";

// Domaine racine du site (sans protocole ni www). Ex : "wanteermako.com".
const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || BRAND.domain || "")
  .replace(/^https?:\/\//, "")
  .replace(/^www\./, "")
  .replace(/\/.*$/, "")
  .replace(/:\d+$/, "")
  .toLowerCase();

/**
 * Domaine de cookie à utiliser pour PARTAGER la session entre tous les
 * sous-domaines (ex : ".wanteermako.com" → vaut pour www, vehicules, immobilier…).
 *
 * Renvoie `undefined` (cookie limité à l'hôte) hors du domaine racine :
 * localhost, *.netlify.app, previews, IP… — sinon le navigateur rejette le cookie.
 */
export function crossSubdomainCookieDomain(host?: string | null): string | undefined {
  if (!ROOT || ROOT === "localhost") return undefined;
  const h = (host || "")
    .split(",")[0]
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .toLowerCase();
  if (!h) return undefined;
  return h === ROOT || h.endsWith("." + ROOT) ? "." + ROOT : undefined;
}
