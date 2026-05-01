import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const from = searchParams.get('from')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return NextResponse.redirect(new URL(from, req.nextUrl.origin))
  } else {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    url.searchParams.set('login', 'success')
    return NextResponse.redirect(url)
  }
}
