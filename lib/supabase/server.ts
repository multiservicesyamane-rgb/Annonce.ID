import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { crossSubdomainCookieDomain } from "@/lib/cookieDomain";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Client Supabase côté serveur (Server Components / Route Handlers).
 * Renvoie null si non configuré (mode démo).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  // Domaine partagé entre sous-domaines (session unique sur tout le site).
  let cookieDomain: string | undefined;
  try {
    cookieDomain = crossSubdomainCookieDomain(headers().get("host"));
  } catch {
    cookieDomain = undefined;
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, cookieDomain ? { ...options, domain: cookieDomain } : options),
          );
        } catch {
          // setAll appelé depuis un Server Component — ignorable si middleware gère le refresh.
        }
      },
    },
    ...(cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {}),
  });
}
