import { NextResponse } from 'next/server'
import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'

function getAllowedOrigin(request: Request) {
  const originHeader = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!originHeader || !host) return null

  try {
    const origin = new URL(originHeader)
    if (
      (origin.protocol === 'https:' || origin.protocol === 'http:') &&
      origin.origin === originHeader &&
      origin.host === host
    ) {
      return origin.origin
    }
  } catch {
    // Invalid origin.
  }
  return null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const appOrigin = getAllowedOrigin(request)
    if (!appOrigin) {
      return NextResponse.json(
        { error: 'Request origin is not allowed.' },
        { status: 403 },
      )
    }
    const contentType = request.headers
      .get('content-type')
      ?.split(';')[0]
      .trim()
      .toLowerCase()
    if (contentType !== 'application/json') {
      return NextResponse.json(
        { error: 'A JSON request is required.' },
        { status: 415 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request.' },
        { status: 400 },
      )
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Enter a username or email address.' },
        { status: 400 },
      )
    }

    const candidate = body as Record<string, unknown>
    const identifier = candidate.identifier ?? candidate.username
    if (typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Enter a username or email address.' },
        { status: 400 },
      )
    }

    const { id } = await params
    const result = await inviteUserToTower({
      towerId: id,
      identifier,
      appOrigin,
    })
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Tower invitation request failed.', error)
    return NextResponse.json(
      { error: 'Unable to invite the user. Please try again.' },
      { status: 500 },
    )
  }
}
