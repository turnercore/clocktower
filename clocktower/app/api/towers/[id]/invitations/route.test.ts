import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'
import { POST } from './route'

jest.mock('@/lib/towers/inviteUserToTower', () => ({ inviteUserToTower: jest.fn() }))

const origin = 'https://www.clocktower.monster'
const towerId = '33333333-3333-4333-8333-333333333333'
const invitedId = '22222222-2222-4222-8222-222222222222'
const context = () => ({ params: Promise.resolve({ id: towerId }) })

function request(
  body = JSON.stringify({ username: 'Daisy' }),
  headers: Record<string, string> = {},
  internalOrigin = origin,
) {
  return new Request(`${internalOrigin}/api/towers/${towerId}/invitations`, {
    method: 'POST',
    headers: {
      origin,
      host: new URL(origin).host,
      'content-type': 'application/json',
      ...headers,
    },
    body,
  })
}

describe('POST tower invitations', () => {
  beforeEach(() => {
    jest.mocked(inviteUserToTower).mockReset()
    jest.mocked(inviteUserToTower).mockResolvedValue({
      status: 200,
      body: { data: { success: true, userId: invitedId } },
    })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('accepts same-origin JSON and returns the shared service response', async () => {
    const response = await POST(request(), context())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: { success: true, userId: invitedId } })
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(inviteUserToTower).toHaveBeenCalledWith({ towerId, username: 'Daisy' })
  })

  it('accepts a JSON content type with charset', async () => {
    const response = await POST(request(undefined, { 'content-type': 'application/json; charset=utf-8' }), context())
    expect(response.status).toBe(200)
  })

  it('accepts the browser Host when Next normalizes request.url to localhost', async () => {
    const req = request(undefined, {
      origin: 'http://127.0.0.1:48930',
      host: '127.0.0.1:48930',
    }, 'http://localhost:48930')
    const response = await POST(req, context())
    expect(response.status).toBe(200)
    expect(inviteUserToTower).toHaveBeenCalledTimes(1)
  })

  it('accepts HTTPS browser requests when an internal proxy URL uses HTTP', async () => {
    const response = await POST(request(undefined, {}, 'http://localhost:3000'), context())
    expect(response.status).toBe(200)
    expect(inviteUserToTower).toHaveBeenCalledTimes(1)
  })

  it('does not accept a caller ID or tower ID from the request body', async () => {
    await POST(request(JSON.stringify({ username: 'Daisy', expectedUserId: invitedId, towerId: invitedId })), context())
    expect(inviteUserToTower).toHaveBeenCalledWith({ towerId, username: 'Daisy' })
  })

  it.each([
    'https://other.example',
    'null',
    'https://clocktower.monster',
    '',
    'not a URL',
    'https://www.clocktower.monster/',
    'https://www.clocktower.monster/path',
    'https://www.clocktower.monster?query=1',
    'https://user@www.clocktower.monster',
    'ftp://www.clocktower.monster',
    'file://www.clocktower.monster',
  ])('rejects origin %s before calling the service', async (requestOrigin) => {
    const response = await POST(request(undefined, { origin: requestOrigin }), context())
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Request origin is not allowed.' })
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it('rejects a missing Origin header', async () => {
    const req = request()
    req.headers.delete('origin')
    expect((await POST(req, context())).status).toBe(403)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it('rejects a missing Host even when request.url matches the Origin', async () => {
    const req = request()
    req.headers.delete('host')
    expect((await POST(req, context())).status).toBe(403)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each(['localhost:48930', '127.0.0.1:48931', 'other.example:48930'])('rejects external Host %s that differs from the browser Origin', async (host) => {
    const response = await POST(request(undefined, {
      origin: 'http://127.0.0.1:48930',
      host,
    }, 'http://127.0.0.1:48930'), context())
    expect(response.status).toBe(403)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it('ignores forwarded host and protocol when checking the origin', async () => {
    const response = await POST(request(undefined, {
      origin: 'https://other.example',
      'x-forwarded-host': 'other.example',
      'x-forwarded-proto': 'https',
    }), context())
    expect(response.status).toBe(403)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each(['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', ''])('rejects content type %s', async (contentType) => {
    const response = await POST(request(undefined, { 'content-type': contentType }), context())
    expect(response.status).toBe(415)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each(['{', '', 'null', '[]', '{}', '{"username":5}'])('rejects malformed JSON or body %s', async (body) => {
    const response = await POST(request(body), context())
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: expect.any(String) })
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each([400, 401, 403, 404, 409, 500, 503])('preserves a service error with status %s', async (status) => {
    jest.mocked(inviteUserToTower).mockResolvedValue({ status, body: { error: 'Invitation rejected' } })
    const response = await POST(request(), context())
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: 'Invitation rejected' })
  })

  it('handles a thrown service error with a JSON response', async () => {
    jest.mocked(inviteUserToTower).mockRejectedValue(new Error('Transport error'))
    const response = await POST(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Unable to invite the user. Please try again.' })
  })
})
