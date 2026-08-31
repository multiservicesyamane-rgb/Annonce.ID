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

export function getRootUrl(): string {
  if (USE_LOCAL_SUBDOMAINS) {
    return `http://${LOCALHOST_DOMAIN}${getLocalPortSuffix()}`;
  }

  return `https://${ROOT_DOMAIN}`;
}

/**
 * URL d'une catégorie en chemin (/categorie/slug), pas en sous-domaine.
 *
 * Les sous-domaines de catégories (vehicules.wanteermako.com…) restent gérés
 * par le middleware (voir getCategoryBySubdomain) mais ne sont plus liés nulle
 * part : le DNS wildcard *.wanteermako.com n'existe plus depuis la migration
 * Netlify → Vercel (qui exigerait de déléguer tout le domaine aux nameservers
 * Vercel — trop risqué pour le transfert d'e-mail du domaine). Décision du
 * 31/08/2026 : ne pas restaurer le wildcard, tout faire passer par le chemin.
 */
export function getCategoryUrl(category: Category): string {
  return `${getRootUrl()}/categorie/${category.slug}`;
}
