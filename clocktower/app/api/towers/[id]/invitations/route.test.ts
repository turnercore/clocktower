import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'
import { POST } from './route'

jest.mock('@/lib/towers/inviteUserToTower', () => ({ inviteUserToTower: jest.fn() }))

const origin = 'https://www.clocktower.monster'
const towerId = '33333333-3333-4333-8333-333333333333'
const context = () => ({ params: Promise.resolve({ id: towerId }) })

function request(body = JSON.stringify({ identifier: 'Daisy' })) {
  return new Request(`${origin}/api/towers/${towerId}/invitations`, {
    method: 'POST',
    headers: { origin, host: 'www.clocktower.monster', 'content-type': 'application/json' },
    body,
  })
}

describe('POST tower invitations', () => {
  beforeEach(() => {
    jest.mocked(inviteUserToTower).mockReset()
    jest.mocked(inviteUserToTower).mockResolvedValue({
      status: 200,
      body: { data: { success: true, userId: 'member', delivery: 'direct' } },
    })
  })

  it('passes identifier and verified origin', async () => {
    const response = await POST(request(), context())
    expect(response.status).toBe(200)
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId,
      identifier: 'Daisy',
      appOrigin: origin,
    })
  })

  it('accepts legacy username payloads during deployment rollover', async () => {
    await POST(request(JSON.stringify({ username: 'Legacy' })), context())
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId,
      identifier: 'Legacy',
      appOrigin: origin,
    })
  })
})
