import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const tokenLifetimeMs = 7 * 24 * 60 * 60 * 1000
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type InviteTokenPayload = {
  v: 1
  t: string
  e: string
  x: number
}

function getInviteSecret() {
  const secret =
    process.env.TOWER_INVITE_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY

  if (!secret) {
    throw new Error('Tower invitation signing is not configured.')
  }
  return secret
}

function emailDigest(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

function signature(payload: string) {
  return createHmac('sha256', getInviteSecret())
    .update(payload)
    .digest('base64url')
}

export function createTowerInviteToken(
  towerId: string,
  email: string,
  now = Date.now(),
) {
  const payload: InviteTokenPayload = {
    v: 1,
    t: towerId,
    e: emailDigest(email),
    x: now + tokenLifetimeMs,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${signature(encoded)}`
}

export function verifyTowerInviteToken(
  token: string,
  email: string,
  now = Date.now(),
): { towerId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, receivedSignature] = parts
  const expectedSignature = signature(encoded)
  const received = Uint8Array.from(Buffer.from(receivedSignature))
  const expected = Uint8Array.from(Buffer.from(expectedSignature))
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null
  }

  let payload: InviteTokenPayload
  try {
    payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as InviteTokenPayload
  } catch {
    return null
  }

  if (
    payload.v !== 1 ||
    !uuidPattern.test(payload.t) ||
    typeof payload.e !== 'string' ||
    typeof payload.x !== 'number' ||
    payload.x <= now
  ) {
    return null
  }

  const receivedEmail = Uint8Array.from(Buffer.from(payload.e))
  const expectedEmail = Uint8Array.from(Buffer.from(emailDigest(email)))
  if (
    receivedEmail.length !== expectedEmail.length ||
    !timingSafeEqual(receivedEmail, expectedEmail)
  ) {
    return null
  }

  return { towerId: payload.t }
}
