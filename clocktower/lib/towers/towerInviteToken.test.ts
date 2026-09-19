import {
  createTowerInviteToken,
  verifyTowerInviteToken,
} from './towerInviteToken'

const towerId = '33333333-3333-4333-8333-333333333333'

describe('tower invite tokens', () => {
  beforeEach(() => {
    process.env.TOWER_INVITE_SECRET = 'test-only-secret'
  })

  it('binds the token to the tower and recipient email', () => {
    const token = createTowerInviteToken(towerId, 'User@Example.com', 1000)
    expect(verifyTowerInviteToken(token, 'user@example.com', 2000)).toEqual({
      towerId,
    })
    expect(verifyTowerInviteToken(token, 'other@example.com', 2000)).toBeNull()
  })

  it('rejects tampering and expiration', () => {
    const token = createTowerInviteToken(towerId, 'user@example.com', 1000)
    expect(
      verifyTowerInviteToken(`${token}x`, 'user@example.com', 2000),
    ).toBeNull()
    expect(
      verifyTowerInviteToken(
        token,
        'user@example.com',
        1000 + 8 * 24 * 60 * 60 * 1000,
      ),
    ).toBeNull()
  })
})
