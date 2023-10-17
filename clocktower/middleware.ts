import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// define routes that require authentication
const protectedRoutes = ['/addKnowledge', '/account', '/api', '/apiKeys', '/search']

// !!!!!!MAKE SURE TO UPDATE THE MATCHER AS WELL IF YOU CHANGE/ADD ROUTES!!!!!!!!
export const config = {
    matcher: [
        '/apiKeys/:path*',
        '/addKnowledge/:path*',
        '/account/:path*',
        '/api/v1/:path*',
        '/search/:path*',
    ],
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function handleUnauthenticatedClient(): NextResponse {
    return NextResponse.redirect('/login')
}

function handleUnauthenticatedApi(): NextResponse {
    return new NextResponse(
        JSON.stringify({ success: false, message: 'authentication failed' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
        )
    }

function isApiRoute(pathname: string): boolean {
  if (pathname.startsWith('/api')) return true
  else return false
}


//-------------- setup middleware ----------------- \\
export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    const session = await supabase.auth.getSession()
    const { pathname } = req.nextUrl

    if (!session) {
        if (isProtectedRoute(pathname)) {
            return isApiRoute(pathname) ? handleUnauthenticatedApi()  : handleUnauthenticatedClient()
        }
    }
    
    return res
}