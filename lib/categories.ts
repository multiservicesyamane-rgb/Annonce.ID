import { CATEGORIES, type Category } from "./constants";

function normalizeDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].toLowerCase();
}

const ROOT_DOMAIN =
  normalizeDomain(process.env.NEXT_PUBLIC_ROOT_DOMAIN || "wanteermako.com") || "wanteermako.com";
const LOCALHOST_DOMAIN = "localhost";
const LOCAL_PORT = (process.env.NEXT_PUBLIC_LOCAL_PORT || "3001").replace(/^:/, "").trim();
const USE_LOCAL_SUBDOMAINS =
  process.env.NEXT_PUBLIC_USE_LOCAL_SUBDOMAINS === "1" || ROOT_DOMAIN === LOCALHOST_DOMAIN;
const RESERVED_SUBDOMAINS = new Set(["www", "api", "admin"]);

function normalizeHost(host: string): string {
  const firstHost = (host || "").split(",")[0]?.trim().toLowerCase() || "";
  const withoutProtocol = firstHost.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  return withoutPath.split(":")[0] || "";
}

function extractSubdomain(hostname: string): string | undefined {
  const rootSuffix = `.${ROOT_DOMAIN}`;
  if (hostname.endsWith(rootSuffix)) {
    const subdomain = hostname.slice(0, -rootSuffix.length);
    return subdomain && !subdomain.includes(".") ? subdomain : undefined;
  }

  const localhostSuffix = `.${LOCALHOST_DOMAIN}`;
  if (hostname.endsWith(localhostSuffix)) {
    const subdomain = hostname.slice(0, -localhostSuffix.length);
    return subdomain && !subdomain.includes(".") ? subdomain : undefined;
  }

  return undefined;
}

export function getCategoryBySubdomain(host: string): Category | undefined {
  const hostname = normalizeHost(host);
  const subdomain = extractSubdomain(hostname);

  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return undefined;
  }

  return CATEGORIES.find((category) => category.subdomainSlug === subdomain);
}

function getLocalPortSuffix(): string {
  return LOCAL_PORT ? `:${LOCAL_PORT}` : "";
}

/**
 * Origine du site telle que le build la voit.
 *
 * ⚠️ NE JAMAIS s'en servir dans un href de navigation interne : si
 * NEXT_PUBLIC_USE_LOCAL_SUBDOMAINS=1 traîne dans l'environnement (c'est le cas
 * de .env.local, et ça peut avoir été recopié dans les variables Vercel), elle
 * vaut http://localhost:3001 — donc un téléphone qui ouvre le site en LAN ou en
 * prod se retrouve renvoyé sur *son propre* localhost. Pour naviguer, utiliser
 * les chemins relatifs (getCategoryPath) ; pour le SEO, getPublicSiteUrl().
 */
export function getRootUrl(): string {
  if (USE_LOCAL_SUBDOMAINS) {
    return `http://${LOCALHOST_DOMAIN}${getLocalPortSuffix()}`;
  }

  return `https://${ROOT_DOMAIN}`;
}

/**
 * Origine publique absolue — pour le SEO uniquement (JSON-LD, sitemap,
 * metadata canoniques). Ne retombe jamais sur localhost, même en dev, sinon
 * on publierait des URLs canoniques inutilisables.
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const host = normalizeDomain(raw);
  if (host && host !== LOCALHOST_DOMAIN) return `https://${host}`;
  return `https://${ROOT_DOMAIN}`;
}

/**
 * Chemin d'une catégorie — à utiliser pour TOUTE navigation interne
 * (<Link href>, router.push). Relatif = indépendant du domaine, donc valide
 * en local, en preview, en prod et depuis un téléphone sur le réseau local.
 *
 * Les sous-domaines de catégories (vehicules.wanteermako.com…) restent gérés
 * par le middleware (voir getCategoryBySubdomain) mais ne sont plus liés nulle
 * part : le DNS wildcard *.wanteermako.com n'existe plus depuis la migration
 * Netlify → Vercel (qui exigerait de déléguer tout le domaine aux nameservers
 * Vercel — trop risqué pour le transfert d'e-mail du domaine). Décision du
 * 31/08/2026 : ne pas restaurer le wildcard, tout faire passer par le chemin.
 */
export function getCategoryPath(category: Category): string {
  return `/categorie/${category.slug}`;
}

/** URL absolue d'une catégorie — SEO uniquement (voir getCategoryPath). */
export function getCategoryUrl(category: Category): string {
  return `${getPublicSiteUrl()}${getCategoryPath(category)}`;
}
