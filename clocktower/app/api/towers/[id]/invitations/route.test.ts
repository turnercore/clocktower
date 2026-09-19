import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'
import { POST } from './route'

jest.mock('@/lib/towers/inviteUserToTower', () => ({ inviteUserToTower: jest.fn() }))

const origin = 'https://www.clocktower.monster'
const towerId = '33333333-3333-4333-8333-333333333333'
const invitedId = '22222222-2222-4222-8222-222222222222'
const context = () => ({ params: Promise.resolve({ id: towerId }) })

function request(
  body = JSON.stringify({ identifier: 'Daisy' }),
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
      body: {
        data: {
          success: true,
          userId: invitedId,
          delivery: 'direct',
        },
      },
    })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('accepts same-origin JSON and passes the verified app origin', async () => {
    const response = await POST(request(), context())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: { success: true, userId: invitedId, delivery: 'direct' },
    })
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId,
      identifier: 'Daisy',
      appOrigin: origin,
    })
  })

  it('accepts JSON with a charset', async () => {
    const response = await POST(
      request(undefined, { 'content-type': 'application/json; charset=utf-8' }),
      context(),
    )
    expect(response.status).toBe(200)
  })

  it('accepts the browser Host when Next normalizes request.url internally', async () => {
    const localOrigin = 'http://127.0.0.1:48930'
    const response = await POST(
      request(
        undefined,
        { origin: localOrigin, host: '127.0.0.1:48930' },
        'http://localhost:48930',
      ),
      context(),
    )
    expect(response.status).toBe(200)
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId,
      identifier: 'Daisy',
      appOrigin: localOrigin,
    })
  })

  it('accepts the legacy username field but ignores caller and tower IDs in the body', async () => {
    await POST(
      request(
        JSON.stringify({
          username: 'Legacy',
          expectedUserId: invitedId,
          towerId: invitedId,
        }),
      ),
      context(),
    )
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId,
      identifier: 'Legacy',
      appOrigin: origin,
    })
  })

  it.each([
    'https://other.example',
    'null',
    'https://clocktower.monster',
    '',
    'not a URL',
    'https://www.clocktower.monster/path',
    'ftp://www.clocktower.monster',
  ])('rejects invalid origin %s', async (requestOrigin) => {
    const response = await POST(
      request(undefined, { origin: requestOrigin }),
      context(),
    )
    expect(response.status).toBe(403)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it('rejects missing Origin and Host headers', async () => {
    const missingOrigin = request()
    missingOrigin.headers.delete('origin')
    expect((await POST(missingOrigin, context())).status).toBe(403)

    const missingHost = request()
    missingHost.headers.delete('host')
    expect((await POST(missingHost, context())).status).toBe(403)

    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each([
    'text/plain',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    '',
  ])('rejects content type %s', async (contentType) => {
    const response = await POST(
      request(undefined, { 'content-type': contentType }),
      context(),
    )
    expect(response.status).toBe(415)
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it.each(['{', '', 'null', '[]', '{}', '{"identifier":5}'])(
    'rejects malformed JSON or body %s',
    async (body) => {
      const response = await POST(request(body), context())
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: expect.any(String) })
      expect(inviteUserToTower).not.toHaveBeenCalled()
    },
  )

  it.each([400, 401, 403, 404, 409, 429, 500, 502, 503])(
    'preserves a service error with status %s',
    async (status) => {
      jest.mocked(inviteUserToTower).mockResolvedValue({
        status,
        body: { error: 'Invitation rejected' },
      })
      const response = await POST(request(), context())
      expect(response.status).toBe(status)
      expect(await response.json()).toEqual({ error: 'Invitation rejected' })
    },
  )

  it('handles thrown service errors with JSON', async () => {
    jest.mocked(inviteUserToTower).mockRejectedValue(new Error('Transport error'))
    const response = await POST(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Unable to invite the user. Please try again.',
    })
  })
})
