import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const fromUrl = searchParams.get('from')
    ? new URL(searchParams.get('from')!)
    : ''

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }
  if (fromUrl) {
    return NextResponse.redirect(fromUrl)
  } else {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}
