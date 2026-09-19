import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inviteUserToTower } from './inviteUserToTower'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }))

const owner = '11111111-1111-4111-8111-111111111111'
const member = '22222222-2222-4222-8222-222222222222'
const towerId = '33333333-3333-4333-8333-333333333333'
const newUser = '44444444-4444-4444-8444-444444444444'

function setup() {
  let matches = [{ user_id: member, email_confirmed: true }]
  const towerQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { owner, users: [owner], admin_users: [], is_locked: false },
      error: null,
    }),
  }
  const client = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: owner } }, error: null }) },
    from: jest.fn((table: string) => table === 'towers'
      ? towerQuery
      : { upsert: jest.fn().mockResolvedValue({ error: null }) }),
    rpc: jest.fn((name: string) => Promise.resolve(
      name === 'find_tower_invite_target'
        ? { data: matches, error: null }
        : { data: null, error: null },
    )),
  }
  const admin = {
    auth: { admin: {
      inviteUserByEmail: jest.fn().mockResolvedValue({ data: { user: { id: newUser } }, error: null }),
      deleteUser: jest.fn().mockResolvedValue({ error: null }),
    } },
  }
  jest.mocked(createClient).mockResolvedValue(client as never)
  jest.mocked(createAdminClient).mockReturnValue(admin as never)
  return { client, admin, towerQuery, setMatches: (value: typeof matches) => { matches = value } }
}

describe('inviteUserToTower', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_DOMAIN = 'https://www.clocktower.monster'
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('returns a descriptive error when inviting yourself', async () => {
    const env = setup()
    env.setMatches([{ user_id: owner, email_confirmed: true }])
    await expect(inviteUserToTower({ towerId, identifier: 'me@example.com' })).resolves.toEqual({
      status: 409,
      body: { error: "You're already in this tower." },
    })
  })

  it('returns a descriptive error for an already invited email', async () => {
    const env = setup()
    env.setMatches([{ user_id: member, email_confirmed: false }])
    env.towerQuery.maybeSingle.mockResolvedValue({
      data: { owner, users: [owner, member], admin_users: [], is_locked: false },
      error: null,
    })
    await expect(inviteUserToTower({ towerId, identifier: 'pending@example.com' })).resolves.toEqual({
      status: 409,
      body: { error: 'This email has already been invited to this tower.' },
    })
  })

  it('adds an existing account by email without sending an invite email', async () => {
    const env = setup()
    const result = await inviteUserToTower({ towerId, identifier: 'member@example.com' })
    expect(result).toMatchObject({ status: 200, body: { data: { delivery: 'direct' } } })
    expect(env.admin.auth.admin.inviteUserByEmail).not.toHaveBeenCalled()
  })

  it('creates and emails a new account, then grants tower membership', async () => {
    const env = setup()
    env.setMatches([])
    const result = await inviteUserToTower({ towerId, identifier: 'new@example.com' })
    expect(env.admin.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('new@example.com', {
      redirectTo: 'https://www.clocktower.monster/',
      data: { clocktower_invite_tower_id: towerId },
    })
    expect(env.client.rpc).toHaveBeenCalledWith('add_user_to_tower', {
      tower: towerId,
      new_user_id: newUser,
    })
    expect(result).toEqual({
      status: 200,
      body: { data: { success: true, userId: newUser, delivery: 'email' } },
    })
  })

  it('treats an @ username as a username unless it is a valid email', async () => {
    const env = setup()
    env.setMatches([{ user_id: member, email_confirmed: true }])
    await inviteUserToTower({ towerId, identifier: 'foo@bar' })
    expect(env.client.rpc).toHaveBeenCalledWith('find_tower_invite_target', {
      tower: towerId,
      identifier: 'foo@bar',
      lookup_by_email: false,
    })
  })

  it('tells the inviter to use email when a username is unknown', async () => {
    const env = setup()
    env.setMatches([])
    await expect(inviteUserToTower({ towerId, identifier: 'missing' })).resolves.toEqual({
      status: 404,
      body: { error: 'No user found with that username. Enter their email address to send an invitation.' },
    })
  })
})
