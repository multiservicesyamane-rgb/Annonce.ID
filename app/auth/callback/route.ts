import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSafeRedirectPath } from '@/lib/authRedirect'
import { crossSubdomainCookieDomain } from '@/lib/cookieDomain'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = getSafeRedirectPath(searchParams.get('next'), '/dashboard')
  const cookieDomain = crossSubdomainCookieDomain(request.headers.get('host') || new URL(request.url).host)

  const redirectToLogin = (error?: string, reason?: string) => {
    const url = new URL('/connexion', origin)
    if (error) url.searchParams.set('error', error)
    // DIAGNOSTIC (temporaire) : expose la vraie cause pour dépanner le login Google.
    if (reason) url.searchParams.set('reason', reason.slice(0, 200))
    return NextResponse.redirect(url)
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, cookieDomain ? { ...options, domain: cookieDomain } : options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
        ...(cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {}),
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      // Diagnostic cible : « code verifier not found » ne dit pas SI le cookie
      // est absent, ou present mais illisible. On journalise donc les NOMS des
      // cookies recus (jamais les valeurs : ce sont des jetons), l'hote
      // d'arrivee et le domaine de cookie calcule — les trois causes possibles.
      const names = cookieStore.getAll().map((c) => c.name)
      const projectRef = (() => {
        try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0] } catch { return '' }
      })()
      const hasVerifier = names.some((n) => n.endsWith('-code-verifier'))

      console.error('[auth/callback] exchangeCodeForSession a échoué:', error.message, {
        hote: request.headers.get('host'),
        domaineCookie: cookieDomain || '(hote seul)',
        verificateurPresent: hasVerifier,
        cookiesSupabase: names.filter((n) => n.startsWith(`sb-${projectRef}`)),
        nbCookies: names.length,
      })

      // `v0` : aucun cookie de vérificateur n'est arrivé jusqu'ici — le flux a
      // commencé sur un autre hôte, ou le cookie n'a jamais été écrit.
      // `v1` : il est là mais l'échange échoue quand même (code déjà consommé,
      // ou vérificateur d'une tentative précédente).
      return redirectToLogin('callback', `exchange[v${hasVerifier ? 1 : 0}]:${error.message}`)
    }

    return NextResponse.redirect(new URL(next, origin))
  }

  // Pas de code : Google/Supabase a renvoyé une erreur ou l'utilisateur a annulé.
  const providerError = searchParams.get('error_description') || searchParams.get('error')
  console.error('[auth/callback] aucun code reçu. Détail fournisseur:', providerError || '(aucun)')
  return redirectToLogin('callback', providerError ? `provider:${providerError}` : 'nocode')
}
