import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return undefined // on ne lit pas les cookies dans ce route handler GET
          },
          set(name: string, value: string, options: CookieOptions) {
             // ceci est géré par le NextResponse en dessous
          },
          remove(name: string, options: CookieOptions) {
             // ceci est géré par le NextResponse en dessous
          },
        },
      }
    )
    
    // Le vrai échange de code se fait sans utiliser les cookies de request car la méthode exchangeCodeForSession
    // mettra à jour la session dans l'objet supabase, mais on va utiliser une méthode SSR standard:
    
    const response = NextResponse.redirect(`${origin}${next}`)
    
    const supabaseWithCookies = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await supabaseWithCookies.auth.exchangeCodeForSession(code)

    return response
  }

  // S'il n'y a pas de code, redirige vers la connexion
  return NextResponse.redirect(`${origin}/connexion`)
}
