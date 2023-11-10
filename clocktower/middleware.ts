import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, NextRequest } from 'next/server'
import { Database } from './types/supabase'

// define routes that require authentication
const protectedRoutes = ['/tower, /account']

// !!!!!!MAKE SURE TO UPDATE THE MATCHER AS WELL IF YOU CHANGE/ADD ROUTES!!!!!!!!
export const config = {
  matcher: [
    '/tower/:path*', // matches /tower and /tower/anything-else
    '/account/profile/:path*',
  ],
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route))
}

function handleUnauthenticatedClient(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/account/login'
  return NextResponse.rewrite(url)
  // return NextResponse.redirect('/login')
}

function handleUnauthenticatedApi(): NextResponse {
  return new NextResponse(
    JSON.stringify({ success: false, message: 'authentication failed' }),
    { status: 401, headers: { 'content-type': 'application/json' } },
  )
}

function isApiRoute(pathname: string): boolean {
  if (pathname.startsWith('/api')) return true
  else return false
}

//-------------- setup middleware ----------------- \\
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  const { data, error } = await supabase.auth.getSession()
  const session = data?.session
  const { pathname } = req.nextUrl

  if (!session || error) {
    if (isProtectedRoute(pathname)) {
      return isApiRoute(pathname)
        ? handleUnauthenticatedApi()
        : handleUnauthenticatedClient(req)
    }
  }
  return res
}
