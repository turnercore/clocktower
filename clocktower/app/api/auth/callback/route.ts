import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const fromUrl = searchParams.get('from') ? new URL(searchParams.get('from')!) : ''

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