import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { pathname, searchParams } = request.nextUrl
  const isPublicTower = pathname.startsWith('/tower/') && searchParams.has('public_key')
  const requiresAuth =
    pathname.startsWith('/account/profile') ||
    (pathname.startsWith('/tower/') && !isPublicTower)

  if (requiresAuth && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/account/login'
    redirectUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
