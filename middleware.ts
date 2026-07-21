import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getCategoryBySubdomain } from './lib/categories'
import { getSubRouteQuery } from './lib/subRoutes'
import { getSafeRedirectPath } from './lib/authRedirect'
import { crossSubdomainCookieDomain } from './lib/cookieDomain'

const SHORT_LISTING_PATH_REGEX = /^\/[^/]+-\d{10,}$/

// Mode maintenance (toggle admin). Lu via /api/settings, mis en cache 30 s pour
// éviter un appel par requête. Fail-safe : en cas d'erreur on ne bloque pas.
let maintCache = { at: 0, on: false }
async function isMaintenanceOn(request: NextRequest): Promise<boolean> {
  if (Date.now() - maintCache.at < 30000) return maintCache.on
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/settings`, { cache: 'no-store' })
    const data = await res.json()
    maintCache = { at: Date.now(), on: !!data?.flags?.maintenance }
  } catch {
    maintCache = { at: Date.now(), on: maintCache.on }
  }
  return maintCache.on
}

// Restent accessibles même en maintenance : back-office, API, auth, la page
// de maintenance elle-même.
function isMaintenanceExempt(pathname: string): boolean {
  return (
    pathname.startsWith('/yamanetech') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/connexion') ||
    pathname === '/maintenance'
  )
}

function getSupabaseProjectRef(supabaseUrl: string) {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || ''
  } catch {
    return ''
  }
}

function clearSupabaseAuthCookies(response: NextResponse, request: NextRequest, supabaseUrl: string, cookieDomain?: string) {
  const projectRef = getSupabaseProjectRef(supabaseUrl)
  if (!projectRef) return

  const authCookiePrefix = `sb-${projectRef}-auth-token`
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith(authCookiePrefix)) {
      response.cookies.delete(name)
      // Efface aussi la variante partagée entre sous-domaines (domaine explicite).
      if (cookieDomain) {
        response.cookies.set(name, '', { path: '/', domain: cookieDomain, maxAge: 0 })
      }
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

  // Mode maintenance : redirige le public vers /maintenance (admin/API/auth exemptés).
  if (!isMaintenanceExempt(originalPathname) && (await isMaintenanceOn(request))) {
    const maintenanceUrl = request.nextUrl.clone()
    maintenanceUrl.pathname = '/maintenance'
    maintenanceUrl.search = ''
    return NextResponse.rewrite(maintenanceUrl)
  }

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

  // Domaine partagé entre sous-domaines (ex : .wanteermako.com) → la session
  // suit l'utilisateur d'un sous-domaine à l'autre (plus de re-connexion).
  const cookieDomain = crossSubdomainCookieDomain(request.headers.get('host') || request.nextUrl.host)

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = createSupabaseResponse()
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, cookieDomain ? { ...options, domain: cookieDomain } : options)
        )
      },
    },
    ...(cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {}),
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
    clearSupabaseAuthCookies(supabaseResponse, request, supabaseUrl, cookieDomain)
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
      clearSupabaseAuthCookies(response, request, supabaseUrl, cookieDomain)
    }
    return response
  }

  return supabaseResponse
}

export const config = {
  // Matcher global pour intercepter toutes les requêtes (sauf les fichiers statiques Next.js et les images)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|json|ico|txt|xml|woff|woff2)$).*)'],
}
