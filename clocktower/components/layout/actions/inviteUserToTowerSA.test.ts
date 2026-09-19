import { inviteUserToTower } from '@/lib/towers/inviteUserToTower'
import inviteUserToTowerSA from './inviteUserToTowerSA'

jest.mock('@/lib/towers/inviteUserToTower', () => ({ inviteUserToTower: jest.fn() }))

const input = {
  inputUserId: '11111111-1111-4111-8111-111111111111',
  inputInvitedUsername: 'Daisy',
  inputTowerId: '33333333-3333-4333-8333-333333333333',
}

describe('legacy inviteUserToTowerSA', () => {
  beforeEach(() => {
    jest.mocked(inviteUserToTower).mockReset()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('preserves the caller ID verification and legacy success response', async () => {
    jest.mocked(inviteUserToTower).mockResolvedValue({
      status: 200,
      body: { data: { success: true, userId: '22222222-2222-4222-8222-222222222222', delivery: 'direct' } },
    })
    expect(await inviteUserToTowerSA(input)).toEqual({ data: { success: true } })
    expect(inviteUserToTower).toHaveBeenCalledWith({
      towerId: input.inputTowerId,
      username: input.inputInvitedUsername,
      expectedUserId: input.inputUserId,
    })
  })

  it('passes service errors to existing callers', async () => {
    jest.mocked(inviteUserToTower).mockResolvedValue({
      status: 403,
      body: { error: 'Requesting user does not match the active session.' },
    })
    expect(await inviteUserToTowerSA(input)).toEqual({
      error: 'Requesting user does not match the active session.',
    })
  })

  it.each(['', 'invalid', undefined])('rejects an absent or invalid legacy caller ID %s', async (inputUserId) => {
    const result = await inviteUserToTowerSA({
      ...input,
      inputUserId,
    } as Parameters<typeof inviteUserToTowerSA>[0])
    expect(result).toEqual({ error: expect.any(String) })
    expect(inviteUserToTower).not.toHaveBeenCalled()
  })

  it('converts a thrown service failure to the legacy error response', async () => {
    jest.mocked(inviteUserToTower).mockRejectedValue(new Error('Connection lost'))
    expect(await inviteUserToTowerSA(input)).toEqual({ error: 'Connection lost' })
  })
})
