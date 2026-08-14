import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

const PROTECTED_PREFIXES = ['/dashboard', '/onboarding']
const AUTH_PAGES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  // With Fluid compute, don't put this client in a global variable.
  // Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // @supabase/ssr 0.12: setAll receives a second `headers` argument
        // carrying Cache-Control/Expires/Pragma. Those must land on the
        // response, or a CDN can cache one user's Set-Cookie and serve it
        // to another user. The registry starter omits this.
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value)
          }
        },
      },
    }
  )

  // Do not run code between createServerClient and getClaims(). A refresh
  // that completes after the response is committed is lost, and the next
  // request refreshes again. getClaims() verifies the JWT locally against
  // the project JWKS; never getSession(), which does not verify at all.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
  const isAuthPage = AUTH_PAGES.includes(path)

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', path)
    return withCookies(NextResponse.redirect(url), response)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return withCookies(NextResponse.redirect(url), response)
  }

  return response
}

/**
 * Carries any refreshed auth cookies from the response the Supabase client
 * wrote to onto a redirect. Returning a bare NextResponse.redirect() here is
 * the classic cause of random logouts.
 */
function withCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie)
  }
  return target
}
