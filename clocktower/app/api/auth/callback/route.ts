import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
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
    url.pathname = '/'
    url.search = ''
    url.searchParams.set('login', 'success')
    return NextResponse.redirect(url)
  }
}
