const FALLBACK_ORIGIN = "https://wanteermako.local";

export function getSafeRedirectPath(value: string | null | undefined, fallback = "/") {
  const candidate = value?.trim();
  if (!candidate) return fallback;

  try {
    const url = new URL(candidate, FALLBACK_ORIGIN);
    if (url.origin !== FALLBACK_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getCurrentPathWithSearch() {
  if (typeof window === "undefined") return "/";
  return getSafeRedirectPath(`${window.location.pathname}${window.location.search}`);
}

export function getLoginUrl(redirectTo?: string | null) {
  const safeRedirect = getSafeRedirectPath(redirectTo, "/");
  return `/connexion?redirect=${encodeURIComponent(safeRedirect)}`;
}
