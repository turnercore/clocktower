import { NextResponse } from 'next/server'
import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'

function isAllowedOrigin(request: Request) {
  const originHeader = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!originHeader || !host) return false

  try {
    const origin = new URL(originHeader)
    // Next can normalize request.url to an internal hostname. Compare against
    // the actual request Host, never an arbitrary forwarded-host header.
    return (
      (origin.protocol === 'https:' || origin.protocol === 'http:') &&
      origin.origin === originHeader &&
      origin.host === host
    )
  } catch {
    return false
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
    }
    const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    if (contentType !== 'application/json') {
      return NextResponse.json({ error: 'A JSON request is required.' }, { status: 415 })
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
      !('username' in body) ||
      typeof body.username !== 'string'
    ) {
      return NextResponse.json({ error: 'Enter a username.' }, { status: 400 })
    }

    const { id } = await params
    const result = await inviteUserToTower({ towerId: id, username: body.username })
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Tower invitation request failed.', error)
    return NextResponse.json(
      { error: 'Unable to invite the user. Please try again.' },
      { status: 500 },
    )
  }
}
