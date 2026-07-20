import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getCategoryBySubdomain } from './lib/categories'
import { getSubRouteQuery } from './lib/subRoutes'
import { getSafeRedirectPath } from './lib/authRedirect'

const SHORT_LISTING_PATH_REGEX = /^\/[^/]+-\d{10,}$/

function getSupabaseProjectRef(supabaseUrl: string) {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest, supabaseUrl: string) {
  const projectRef = getSupabaseProjectRef(supabaseUrl)
  if (!projectRef) return

  const authCookiePrefix = `sb-${projectRef}-auth-token`
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(authCookiePrefix)) {
      response.cookies.delete(name)
    }
  })
}

function isInvalidSessionError(error: unknown) {
  if (!error) return false

  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : ''
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  return code === 'refresh_token_not_found' || message.includes('refresh token')
}

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

  let user: User | null = null
  let authError: unknown = null

  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    authError = error
  } catch (error) {
    authError = error
  }

  const hasInvalidSession = isInvalidSessionError(authError)
  if (hasInvalidSession) {
    clearSupabaseAuthCookies(supabaseResponse, request, supabaseUrl)
  }

  const pathname = shouldRewriteCategorySubdomain ? rewriteUrl.pathname : originalPathname;

  // SECURITE: seules les pages RÉELLEMENT privées exigent une session.
  // Tout le reste (pages publiques OU URL inconnue) passe : une URL inconnue
  // doit afficher un vrai 404, pas rediriger vers /connexion (SEO + UX).
  const isPrivateRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/favoris') ||
    pathname.startsWith('/publier');

  if (isPrivateRoute && !user) {
    const url = request.nextUrl.clone()
    const redirectPath = getSafeRedirectPath(`${originalPathname}${request.nextUrl.search}`, '/')
    url.pathname = '/connexion'
    url.search = ''
    url.searchParams.set('redirect', redirectPath)
    if (hasInvalidSession) url.searchParams.set('error', 'session')

    const response = NextResponse.redirect(url)
    if (hasInvalidSession) {
      clearSupabaseAuthCookies(response, request, supabaseUrl)
    }
    return response
  }

  return supabaseResponse
}

export const config = {
  // Matcher global pour intercepter toutes les requêtes (sauf les fichiers statiques Next.js et les images)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|json|ico|txt|xml|woff|woff2)$).*)'],
}
