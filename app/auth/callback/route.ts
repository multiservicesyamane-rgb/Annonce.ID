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

  const redirectToLogin = (error?: string) => {
    const url = new URL('/connexion', origin)
    if (error) url.searchParams.set('error', error)
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
    if (error) return redirectToLogin('callback')

    return NextResponse.redirect(new URL(next, origin))
  }

  // S'il n'y a pas de code, redirige vers la connexion
  return redirectToLogin('callback')
}
