import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getCategoryBySubdomain } from './lib/categories'
import { getSubRouteQuery } from './lib/subRoutes'

const SHORT_LISTING_PATH_REGEX = /^\/[^/]+-\d{10,}$/

export async function middleware(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname
  const categoryFromSubdomain = getCategoryBySubdomain(
    request.headers.get('host') || request.nextUrl.host,
  )
  const subRouteMatch = !SHORT_LISTING_PATH_REGEX.test(originalPathname)
    ? originalPathname.match(/^\/([a-z0-9-]+)$/)
    : null
  const subRouteQuery =
    categoryFromSubdomain && subRouteMatch
      ? getSubRouteQuery(categoryFromSubdomain.slug, subRouteMatch[1])
      : undefined

  const rewriteUrl = request.nextUrl.clone()
  const shouldRewriteCategorySubdomain =
    !!categoryFromSubdomain && (originalPathname === '/' || !!subRouteQuery)

  if (categoryFromSubdomain && shouldRewriteCategorySubdomain) {
    rewriteUrl.pathname =
      originalPathname === '/'
        ? `/categorie/${categoryFromSubdomain.slug}/accueil`
        : `/categorie/${categoryFromSubdomain.slug}`

    if (subRouteQuery) {
      Object.entries(subRouteQuery).forEach(([key, value]) => {
        rewriteUrl.searchParams.set(key, value)
      })
    }
  }

  const createSupabaseResponse = () =>
    shouldRewriteCategorySubdomain
      ? NextResponse.rewrite(rewriteUrl, { request })
      : NextResponse.next({ request })

  let supabaseResponse = createSupabaseResponse()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // SECURITE: 1.6 Validation au démarrage (Fail-fast)
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("CRITICAL: Variables d'environnement Supabase manquantes. L'application ne peut pas démarrer de manière sécurisée.");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = createSupabaseResponse()
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = shouldRewriteCategorySubdomain ? rewriteUrl.pathname : originalPathname;

  // SECURITE: 3.2 Liste Blanche (Whitelist routing) au lieu de Liste Noire
  // On définit explicitement ce qui est public, TOUT LE RESTE est bloqué par défaut.
  const isPublicRoute = 
    pathname === '/' ||
    pathname === '/connexion' ||
    pathname === '/yamanetech' || // La page de login admin
    pathname.startsWith('/yamanetech/super-admin') || // Super Admin (auth propre)
    pathname.startsWith('/mentions-legales') ||
    pathname.startsWith('/politique-confidentialite') ||
    pathname.startsWith('/comment-ca-marche') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/publicite') ||
    pathname.startsWith('/assurance') ||
    pathname.startsWith('/inscription') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/recherche') ||
    pathname.startsWith('/categorie') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/annonces') ||
    pathname.startsWith('/annonce') ||
    pathname.startsWith('/boutique') ||
    pathname.startsWith('/aide') ||
    pathname.startsWith('/securite') ||
    pathname.startsWith('/cgu') ||
    pathname.startsWith('/affiches') ||
    pathname.startsWith('/promo') ||
    // Liens courts d'annonces : /<slug> (slug terminant par l'horodatage, ex. -1781448052581)
    SHORT_LISTING_PATH_REGEX.test(pathname) ||
    pathname.startsWith('/api'); // Les APIs ont leurs propres vérifications d'auth

  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Matcher global pour intercepter toutes les requêtes (sauf les fichiers statiques Next.js et les images)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|json|ico|txt|xml|woff|woff2)$).*)'],
}
