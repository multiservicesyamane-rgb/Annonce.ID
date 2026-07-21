import { createBrowserClient } from '@supabase/ssr'
import { crossSubdomainCookieDomain } from '@/lib/cookieDomain'

export function createClient() {
  // Domaine partagé entre sous-domaines : la session posée sur la page de
  // connexion vaut pour vehicules.*, immobilier.*, etc. (plus de re-login).
  const cookieDomain =
    typeof window !== 'undefined'
      ? crossSubdomainCookieDomain(window.location.hostname)
      : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookieDomain ? { cookieOptions: { domain: cookieDomain } } : undefined
  )
}
