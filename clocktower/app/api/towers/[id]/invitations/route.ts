import { NextResponse } from 'next/server'
import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) {
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
