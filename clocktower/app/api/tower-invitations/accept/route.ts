import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTowerInviteToken } from '@/lib/towers/towerInviteToken'

function isAllowedOrigin(request: Request) {
  const originHeader = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!originHeader || !host) return false

  try {
    const origin = new URL(originHeader)
    return (
      (origin.protocol === 'https:' || origin.protocol === 'http:') &&
      origin.origin === originHeader &&
      origin.host === host
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: 'Request origin is not allowed.' },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 })
  }

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !('token' in body) ||
    typeof body.token !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invitation token is required.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data.user
  if (error || !user?.id || !user.email) {
    return NextResponse.json(
      { error: 'Sign in with the invited email address first.' },
      { status: 401 },
    )
  }

  const verified = verifyTowerInviteToken(body.token, user.email)
  if (!verified) {
    return NextResponse.json(
      { error: 'This invitation link is invalid or has expired.' },
      { status: 403 },
    )
  }

  try {
    const admin = createAdminClient()
    const { error: membershipError } = await admin.rpc(
      'accept_tower_email_invitation',
      {
        tower: verified.towerId,
        new_user_id: user.id,
      },
    )
    if (membershipError) {
      console.error('Unable to repair tower invitation membership.', membershipError)
      return NextResponse.json(
        { error: 'Could not finish joining the tower. Please try again.' },
        { status: 500 },
      )
    }
  } catch (acceptError) {
    console.error('Unable to accept tower invitation.', acceptError)
    return NextResponse.json(
      { error: 'Could not finish joining the tower. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    data: { success: true, towerId: verified.towerId },
  })
}
