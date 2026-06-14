import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si les clés ne sont pas encore configurées, on laisse passer pour le design
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isYamanetech = request.nextUrl.pathname.startsWith('/yamanetech')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isPublier = request.nextUrl.pathname.startsWith('/publier')
  const isPaiement = request.nextUrl.pathname.startsWith('/paiement')

  const needsAuth = isYamanetech || isDashboard || isPublier || isPaiement

  // 1. Rediriger vers la connexion si l'utilisateur n'est pas connecté
  if (needsAuth && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  // 2. Sécurisation stricte de l'interface Administrateur (/yamanetech)
  if (isYamanetech && user) {
    // Si c'est le super-admin (nouveau dossier), vérifier l'email
    if (request.nextUrl.pathname.startsWith('/yamanetech/super-admin')) {
      const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "multiservicesyamane@gmail.com";
      if (user.email !== SUPER_ADMIN_EMAIL) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } else {
      // Pour les autres pages /yamanetech (l'ancien admin), vérifier le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/yamanetech/:path*',
    '/dashboard/:path*',
    '/publier/:path*',
    '/paiement/:path*'
  ],
}
