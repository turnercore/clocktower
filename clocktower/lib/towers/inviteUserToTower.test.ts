import { createClient } from '@/lib/supabase/server'
import { inviteUserToTower } from './inviteUserToTower'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

const ownerId = '11111111-1111-4111-8111-111111111111'
const invitedId = '22222222-2222-4222-8222-222222222222'
const towerId = '33333333-3333-4333-8333-333333333333'
const adminId = '44444444-4444-4444-8444-444444444444'
const input = { towerId, username: 'Daisy' }
const success = { status: 200, body: { data: { success: true, userId: invitedId } } }

function mockClient() {
  const towerQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: { owner: ownerId, admin_users: [adminId], is_locked: false },
      error: null,
    }),
  }
  const profileQuery = {
    select: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [{ id: invitedId }], error: null }),
  }
  const friendsQuery = { upsert: jest.fn().mockResolvedValue({ error: null }) }
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: ownerId } }, error: null }),
      getSession: jest.fn(),
    },
    from: jest.fn((table: string) => {
      if (table === 'towers') return towerQuery
      if (table === 'profiles') return profileQuery
      if (table === 'friends') return friendsQuery
      throw new Error(`Unexpected table: ${table}`)
    }),
    rpc: jest.fn().mockResolvedValue({ error: null }),
  }
  jest.mocked(createClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createClient>>,
  )
  return { client, towerQuery, profileQuery, friendsQuery }
}

describe('inviteUserToTower', () => {
  let db: ReturnType<typeof mockClient>

  beforeEach(() => {
    jest.clearAllMocks()
    db = mockClient()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  it('authenticates the caller and returns the invited user after membership commits', async () => {
    expect(await inviteUserToTower(input)).toEqual(success)
    expect(db.client.auth.getUser).toHaveBeenCalledTimes(1)
    expect(db.client.auth.getSession).not.toHaveBeenCalled()
    expect(db.towerQuery.eq).toHaveBeenCalledWith('id', towerId)
    expect(db.client.rpc).toHaveBeenCalledWith('add_user_to_tower', {
      tower: towerId,
      new_user_id: invitedId,
    })
    expect(db.friendsQuery.upsert).toHaveBeenCalledWith(
      [{ user_id: ownerId, friend_id: invitedId }],
      { onConflict: 'user_id,friend_id', ignoreDuplicates: true },
    )
  })

  it.each([
    { towerId: 'invalid', username: 'Daisy' },
    { towerId, username: '' },
    { towerId, username: '   ' },
    { towerId, username: 'x'.repeat(31) },
    { towerId, username: 42 },
    { towerId, username: 'Daisy', expectedUserId: 'invalid' },
    null,
  ])('rejects invalid input before creating a client: %p', async (invalidInput) => {
    expect(await inviteUserToTower(invalidInput)).toEqual({
      status: 400,
      body: { error: expect.any(String) },
    })
    expect(createClient).not.toHaveBeenCalled()
  })

  it.each([
    { user: null, error: null },
    { user: { id: ownerId }, error: { status: 401, message: 'Invalid JWT' } },
  ])('rejects an unauthenticated session before reading tower data', async ({ user, error }) => {
    db.client.auth.getUser.mockResolvedValue({ data: { user }, error })
    expect(await inviteUserToTower(input)).toEqual({
      status: 401,
      body: { error: 'Please sign in to invite users.' },
    })
    expect(db.client.from).not.toHaveBeenCalled()
  })

  it.each([0, 500, 503])('reports an auth outage with status %s as retryable', async (status) => {
    db.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: { status } })
    expect(await inviteUserToTower(input)).toMatchObject({ status: 503 })
    expect(db.client.from).not.toHaveBeenCalled()
  })

  it('rejects a legacy caller ID that differs from the verified session', async () => {
    expect(await inviteUserToTower({ ...input, expectedUserId: adminId })).toMatchObject({ status: 403 })
    expect(db.client.from).not.toHaveBeenCalled()
  })

  it.each([
    { caller: ownerId, locked: true, expectedStatus: 200 },
    { caller: adminId, locked: false, expectedStatus: 200 },
    { caller: adminId, locked: true, expectedStatus: 403 },
    { caller: invitedId, locked: false, expectedStatus: 403 },
  ])('checks owner/admin permissions for caller $caller, locked=$locked', async ({ caller, locked, expectedStatus }) => {
    db.client.auth.getUser.mockResolvedValue({ data: { user: { id: caller } }, error: null })
    db.towerQuery.maybeSingle.mockResolvedValue({
      data: { owner: ownerId, admin_users: [adminId], is_locked: locked },
      error: null,
    })
    expect(await inviteUserToTower(input)).toMatchObject({ status: expectedStatus })
    if (expectedStatus !== 200) {
      expect(db.client.rpc).not.toHaveBeenCalled()
      expect(db.profileQuery.filter).not.toHaveBeenCalled()
    }
  })

  it('returns a missing tower without attempting an invitation', async () => {
    db.towerQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await inviteUserToTower(input)).toMatchObject({ status: 404 })
    expect(db.client.rpc).not.toHaveBeenCalled()
  })

  it('trims input and matches case-insensitively with all pattern characters literal', async () => {
    const username = String.raw`A%_\*(b)|c.d`
    expect(await inviteUserToTower({ towerId, username: `  ${username}  ` })).toEqual(success)
    expect(db.profileQuery.filter).toHaveBeenCalledWith(
      'username',
      'imatch',
      String.raw`^A%_\\\*\(b\)\|c\.d$`,
    )
    expect(db.profileQuery.limit).toHaveBeenCalledWith(2)
    const pattern = new RegExp(db.profileQuery.filter.mock.calls[0][2], 'i')
    expect(pattern.test(username.toLowerCase())).toBe(true)
    for (const differentName of [
      `prefix${username}`,
      `${username}suffix`,
      'AanythingX*(b)|c.d',
      String.raw`A%_\anything(b)|c.d`,
      String.raw`A%_\*(b)|cXd`,
      'c.d',
    ]) {
      expect(pattern.test(differentName)).toBe(false)
    }
  })

  it.each([
    { profiles: [], status: 404, error: 'No user found with that username.' },
    {
      profiles: [{ id: invitedId }, { id: adminId }],
      status: 409,
      error: 'More than one user has that username. Ask them to choose a unique username.',
    },
  ])('returns a useful error when username lookup has $profiles.length matches', async ({ profiles, status, error }) => {
    db.profileQuery.limit.mockResolvedValue({ data: profiles, error: null })
    expect(await inviteUserToTower(input)).toEqual({ status, body: { error } })
    expect(db.client.rpc).not.toHaveBeenCalled()
    expect(db.friendsQuery.upsert).not.toHaveBeenCalled()
  })

  it.each(['tower', 'profiles'])('stops when the %s query fails', async (query) => {
    const operation = query === 'tower' ? db.towerQuery.maybeSingle : db.profileQuery.limit
    operation.mockResolvedValue({ data: null, error: { message: 'Database unavailable' } })
    expect(await inviteUserToTower(input)).toMatchObject({ status: 500 })
    expect(db.client.rpc).not.toHaveBeenCalled()
  })

  it.each([
    ['42501', 403],
    ['P0002', 404],
    ['22004', 400],
    ['23505', 409],
    ['XX000', 500],
  ])('reports RPC code %s as %s, including a permission change after the initial check', async (code, status) => {
    db.client.rpc.mockResolvedValue({ error: { code, message: 'Database rejected invitation' } })
    expect(await inviteUserToTower(input)).toMatchObject({ status })
    expect(db.friendsQuery.upsert).not.toHaveBeenCalled()
  })

  it.each(['error', 'throw'])('keeps committed membership successful on friends %s', async (failure) => {
    if (failure === 'error') {
      db.friendsQuery.upsert.mockResolvedValue({ error: { message: 'Update denied' } })
    } else {
      db.friendsQuery.upsert.mockRejectedValue(new Error('Connection lost'))
    }
    expect(await inviteUserToTower(input)).toEqual(success)
    expect(db.client.rpc).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it.each(['client', 'auth', 'rpc'])('returns a controlled error for a thrown %s failure', async (operation) => {
    const fail = operation === 'client'
      ? jest.mocked(createClient)
      : operation === 'auth'
        ? db.client.auth.getUser
        : db.client.rpc
    fail.mockRejectedValue(new Error('Connection lost'))
    expect(await inviteUserToTower(input)).toEqual({
      status: 500,
      body: { error: 'Unable to invite the user. Please try again.' },
    })
    expect(db.friendsQuery.upsert).not.toHaveBeenCalled()
  })
})
