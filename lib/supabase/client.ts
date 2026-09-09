import { createBrowserClient } from '@supabase/ssr'
import { crossSubdomainCookieDomain } from '@/lib/cookieDomain'
import { fetchRobuste } from '@/lib/supabase/fetchRobuste'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env vars absentes (build time ou config manquante) → pas de client
  if (!supabaseUrl || !supabaseKey) return null as any;

  // Domaine partagé entre sous-domaines : la session posée sur la page de
  // connexion vaut pour vehicules.*, immobilier.*, etc. (plus de re-login).
  const cookieDomain =
    typeof window !== 'undefined'
      ? crossSubdomainCookieDomain(window.location.hostname)
      : undefined

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      // Le public est en 4G instable : une requete perdue au moment ou l'on
      // tape son mot de passe se lit comme « le site ne marche pas ».
      global: { fetch: fetchRobuste() },
      cookieOptions: {
        domain: cookieDomain,
        path: "/",
        sameSite: "lax",
        secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production"
      }
    }
  )
}
