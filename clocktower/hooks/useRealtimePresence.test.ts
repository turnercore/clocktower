import type { createClient } from '@/lib/supabase/client'
import type { UUID } from '@/types/schemas'
import {
  subscribeToTowerPresence,
  type UserPresence,
} from './useRealtimePresence'

jest.mock('@/lib/supabase/client', () => ({ createClient: jest.fn() }))

const TOWER_ID: UUID = '11111111-1111-4111-8111-111111111111'
const OTHER_TOWER_ID: UUID = '22222222-2222-4222-8222-222222222222'
const USER_ID: UUID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const OTHER_USER_ID: UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

type SessionResult = {
  data: { session: { user: { id: UUID } } | null }
  error: Error | null
}
type PresenceState = Record<string, UserPresence[]>
type Status = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED'

function authenticatedSession(): SessionResult {
  return { data: { session: { user: { id: USER_ID } } }, error: null }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createRoom() {
  const presenceCallbacks = new Map<string, () => void>()
  let statusCallback: ((status: Status) => void | Promise<void>) | undefined
  let subscribed = false
  const room = {
    on: jest.fn(),
    subscribe: jest.fn(),
    track: jest.fn().mockResolvedValue('ok'),
    presenceState: jest.fn((): PresenceState => ({})),
    unsubscribe: jest.fn().mockResolvedValue('ok'),
    emitSync: () => presenceCallbacks.get('sync')?.(),
    emitStatus: async (status: Status) => { await statusCallback?.(status) },
  }
  room.on.mockImplementation(
    (_type: string, filter: { event: string }, callback: () => void) => {
      if (subscribed) throw new Error('Cannot register presence handlers after subscribe')
      presenceCallbacks.set(filter.event, callback)
      return room
    },
  )
  room.subscribe.mockImplementation(
    (callback: (status: Status) => void | Promise<void>) => {
      subscribed = true
      statusCallback = callback
      return room
    },
  )
  return room
}

function createFakeClient() {
  const rooms: ReturnType<typeof createRoom>[] = []
  const registered = new Map<string, ReturnType<typeof createRoom>>()
  const removalResult = jest.fn(async () => 'ok')
  const client = {
    auth: { getSession: jest.fn(async () => authenticatedSession()) },
    channel: jest.fn((topic: string) => {
      // Supabase reuses a registered channel until removal has completed.
      const existing = registered.get(topic)
      if (existing) return existing
      const room = createRoom()
      registered.set(topic, room)
      rooms.push(room)
      return room
    }),
    removeChannel: jest.fn(async (room: ReturnType<typeof createRoom>) => {
      const result = await removalResult()
      if (result === 'ok' || result === 'timed out') {
        for (const [topic, registeredRoom] of registered) {
          if (registeredRoom === room) registered.delete(topic)
        }
      }
      return result
    }),
  }
  return {
    ...client,
    rooms,
    removalResult,
    supabase: client as unknown as ReturnType<typeof createClient>,
  }
}

// Let pending promise continuations finish without network calls or fake timers.
async function flushAsyncWork() {
  await new Promise<void>((resolve) => setImmediate(resolve))
}

const activeCleanups = new Set<() => void>()

function startPresence(
  client: ReturnType<typeof createFakeClient>,
  towerId: UUID = TOWER_ID,
) {
  const onPresence = jest.fn<void, [UserPresence[]]>()
  const stop = subscribeToTowerPresence(client.supabase, towerId, onPresence)
  const cleanup = () => {
    activeCleanups.delete(cleanup)
    stop()
  }
  activeCleanups.add(cleanup)
  return { onPresence, cleanup }
}

afterEach(async () => {
  for (const cleanup of activeCleanups) cleanup()
  await flushAsyncWork()
  jest.restoreAllMocks()
})

test('does not authenticate or open a channel without a tower', async () => {
  const client = createFakeClient()
  const { cleanup } = startPresence(client, '')
  await flushAsyncWork()

  expect(client.auth.getSession).not.toHaveBeenCalled()
  expect(client.channel).not.toHaveBeenCalled()
  cleanup()
  expect(client.removeChannel).not.toHaveBeenCalled()
})

test('clears old presence and waits for the session before opening the tower topic', async () => {
  const client = createFakeClient()
  const session = deferred<SessionResult>()
  client.auth.getSession.mockReturnValueOnce(session.promise)
  const { onPresence } = startPresence(client)

  expect(onPresence).toHaveBeenCalledWith([])
  expect(client.auth.getSession).toHaveBeenCalledTimes(1)
  expect(client.channel).not.toHaveBeenCalled()

  session.resolve(authenticatedSession())
  await flushAsyncWork()

  expect(client.channel).toHaveBeenCalledTimes(1)
  expect(client.channel.mock.calls[0][0]).toBe(`tower_presence:${TOWER_ID}`)
  expect(client.rooms[0].subscribe).toHaveBeenCalledTimes(1)
  expect(client.rooms[0].track).not.toHaveBeenCalled()
})

test.each(['no session', 'auth error', 'rejected lookup', 'thrown lookup'])(
  'leaves presence empty without a channel after %s',
  async (failure) => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const client = createFakeClient()
    if (failure === 'no session') {
      client.auth.getSession.mockResolvedValueOnce({
        data: { session: null }, error: null,
      })
    } else if (failure === 'auth error') {
      client.auth.getSession.mockResolvedValueOnce({
        ...authenticatedSession(), error: new Error('Session unavailable'),
      })
    } else if (failure === 'rejected lookup') {
      client.auth.getSession.mockRejectedValueOnce(new Error('Connection lost'))
    } else {
      client.auth.getSession.mockImplementationOnce(() => {
        throw new Error('Auth client failed')
      })
    }

    const { onPresence, cleanup } = startPresence(client)
    await flushAsyncWork()

    expect(onPresence).toHaveBeenLastCalledWith([])
    expect(client.channel).not.toHaveBeenCalled()
    cleanup()
    expect(client.removeChannel).not.toHaveBeenCalled()
  },
)

test('StrictMode cleanup before auth resolves cannot open a discarded channel', async () => {
  const client = createFakeClient()
  const oldSession = deferred<SessionResult>()
  client.auth.getSession.mockReturnValueOnce(oldSession.promise)
  const oldSubscription = startPresence(client)
  oldSubscription.cleanup()
  expect(client.removeChannel).not.toHaveBeenCalled()

  const currentSubscription = startPresence(client)
  await flushAsyncWork()
  expect(client.channel).toHaveBeenCalledTimes(1)

  oldSession.resolve(authenticatedSession())
  await flushAsyncWork()
  expect(client.channel).toHaveBeenCalledTimes(1)
  expect(oldSubscription.onPresence.mock.calls).toEqual([[[]]])

  const currentPresence = { presence_ref: 'current-tab', user_id: USER_ID }
  client.rooms[0].presenceState.mockReturnValue({ current: [currentPresence] })
  client.rooms[0].emitSync()
  expect(currentSubscription.onPresence).toHaveBeenLastCalledWith([currentPresence])
  expect(oldSubscription.onPresence.mock.calls).toEqual([[[]]])
})

test('tracks only after SUBSCRIBED and tracks again after reconnection', async () => {
  const client = createFakeClient()
  startPresence(client)
  await flushAsyncWork()
  const room = client.rooms[0]

  expect(room.track).not.toHaveBeenCalled()
  for (const status of ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'] as const) {
    await room.emitStatus(status)
  }
  expect(room.track).not.toHaveBeenCalled()

  await room.emitStatus('SUBSCRIBED')
  expect(room.track).toHaveBeenCalledTimes(1)
  expect(room.track).toHaveBeenLastCalledWith({ user_id: USER_ID })

  await room.emitStatus('CHANNEL_ERROR')
  await room.emitStatus('SUBSCRIBED')
  expect(room.track).toHaveBeenCalledTimes(2)
  expect(room.track).toHaveBeenLastCalledWith({ user_id: USER_ID })
  expect(room.presenceState).not.toHaveBeenCalled()
})

test('sync replaces the full snapshot and preserves separate connections for one user', async () => {
  const client = createFakeClient()
  const { onPresence } = startPresence(client)
  await flushAsyncWork()
  const room = client.rooms[0]
  const firstTab = { presence_ref: 'first-tab', user_id: USER_ID }
  const secondTab = { presence_ref: 'second-tab', user_id: USER_ID }
  const friend = { presence_ref: 'friend-tab', user_id: OTHER_USER_ID }

  expect(room.on).toHaveBeenCalledTimes(1)
  expect(room.on).toHaveBeenCalledWith(
    'presence', { event: 'sync' }, expect.any(Function),
  )

  room.presenceState.mockReturnValue({ self: [firstTab, secondTab], friend: [friend] })
  room.emitSync()
  expect(onPresence).toHaveBeenLastCalledWith([firstTab, secondTab, friend])
  room.emitSync()
  expect(onPresence).toHaveBeenLastCalledWith([firstTab, secondTab, friend])

  room.presenceState.mockReturnValue({ self: [secondTab] })
  room.emitSync()
  expect(onPresence).toHaveBeenLastCalledWith([secondTab])

  room.presenceState.mockReturnValue({})
  room.emitSync()
  expect(onPresence).toHaveBeenLastCalledWith([])
})

test('cleanup removes the channel and ignores late sync and subscription callbacks', async () => {
  const client = createFakeClient()
  const { onPresence, cleanup } = startPresence(client)
  await flushAsyncWork()
  const room = client.rooms[0]
  room.presenceState.mockReturnValue({ self: [{ presence_ref: 'old-tab', user_id: USER_ID }] })
  room.emitSync()
  await room.emitStatus('SUBSCRIBED')

  cleanup()
  expect(client.removeChannel).toHaveBeenCalledTimes(1)
  expect(client.removeChannel).toHaveBeenCalledWith(room)
  expect(room.unsubscribe).not.toHaveBeenCalled()
  onPresence.mockClear()
  room.presenceState.mockClear()
  room.track.mockClear()

  room.emitSync()
  await room.emitStatus('SUBSCRIBED')
  await flushAsyncWork()
  expect(onPresence).not.toHaveBeenCalled()
  expect(room.presenceState).not.toHaveBeenCalled()
  expect(room.track).not.toHaveBeenCalled()
})

test.each(['resolved', 'rejected'])(
  'waits for same-topic removal to settle before reopening when removal is %s',
  async (outcome) => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const client = createFakeClient()
    const removal = deferred<string>()
    client.removalResult.mockReturnValueOnce(removal.promise)
    const first = startPresence(client)
    await flushAsyncWork()
    first.cleanup()

    startPresence(client)
    await flushAsyncWork()
    expect(client.channel).toHaveBeenCalledTimes(1)

    if (outcome === 'resolved') removal.resolve('ok')
    else removal.reject(new Error('Connection closed during removal'))
    await flushAsyncWork()

    expect(client.channel.mock.calls.map(([topic]) => topic)).toEqual(outcome === 'resolved'
      ? [`tower_presence:${TOWER_ID}`, `tower_presence:${TOWER_ID}`]
      : [`tower_presence:${TOWER_ID}`])
    if (outcome === 'resolved') {
      expect(client.rooms).toHaveLength(2)
      expect(client.rooms[1]).not.toBe(client.rooms[0])
      await client.rooms[1].emitStatus('SUBSCRIBED')
      expect(client.rooms[1].track).toHaveBeenCalledWith({ user_id: USER_ID })
    } else {
      // Failed removal can retain the old SDK channel. The attempted restart
      // must settle without an unhandled rejection or claiming a fresh channel.
      expect(client.rooms).toHaveLength(1)
      expect(console.error).toHaveBeenCalled()
    }
  },
)

test('cancelling a replacement while removal is pending leaves the next replacement waiting', async () => {
  const client = createFakeClient()
  const removal = deferred<string>()
  client.removalResult.mockReturnValueOnce(removal.promise)
  const first = startPresence(client)
  await flushAsyncWork()
  first.cleanup()

  const cancelled = startPresence(client)
  await flushAsyncWork()
  cancelled.cleanup()
  startPresence(client)
  await flushAsyncWork()
  expect(client.channel).toHaveBeenCalledTimes(1)
  expect(client.removeChannel).toHaveBeenCalledTimes(1)

  removal.resolve('ok')
  await flushAsyncWork()
  expect(client.channel).toHaveBeenCalledTimes(2)
  expect(cancelled.onPresence.mock.calls).toEqual([[[]]])
  await client.rooms[1].emitStatus('SUBSCRIBED')
  expect(client.rooms[1].track).toHaveBeenCalledWith({ user_id: USER_ID })
})

test('removal of one tower does not block another tower on the same client', async () => {
  const client = createFakeClient()
  const removal = deferred<string>()
  client.removalResult.mockReturnValueOnce(removal.promise)
  const first = startPresence(client)
  await flushAsyncWork()
  first.cleanup()

  startPresence(client)
  startPresence(client, OTHER_TOWER_ID)
  await flushAsyncWork()
  expect(client.channel.mock.calls.map(([topic]) => topic)).toEqual([
    `tower_presence:${TOWER_ID}`, `tower_presence:${OTHER_TOWER_ID}`,
  ])

  removal.resolve('ok')
  await flushAsyncWork()
  expect(client.channel.mock.calls.map(([topic]) => topic)).toEqual([
    `tower_presence:${TOWER_ID}`, `tower_presence:${OTHER_TOWER_ID}`, `tower_presence:${TOWER_ID}`,
  ])
})

test('removal on one client does not block the same tower on another client', async () => {
  const firstClient = createFakeClient()
  const secondClient = createFakeClient()
  const removal = deferred<string>()
  firstClient.removalResult.mockReturnValueOnce(removal.promise)
  const first = startPresence(firstClient)
  await flushAsyncWork()
  first.cleanup()

  startPresence(firstClient)
  startPresence(secondClient)
  await flushAsyncWork()
  expect(firstClient.channel).toHaveBeenCalledTimes(1)
  expect(secondClient.channel).toHaveBeenCalledTimes(1)
  expect(secondClient.channel.mock.calls[0][0]).toBe(`tower_presence:${TOWER_ID}`)

  removal.resolve('ok')
  await flushAsyncWork()
  expect(firstClient.channel).toHaveBeenCalledTimes(2)
})
