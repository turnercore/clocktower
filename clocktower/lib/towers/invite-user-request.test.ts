import { inviteUserToTower } from './invite-user-request'

const originalFetch = global.fetch
const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch
})
afterAll(() => { global.fetch = originalFetch })

test('sends a username or email as identifier', async () => {
  mockFetch.mockResolvedValue(Response.json({
    data: { success: true, userId: 'member-id', delivery: 'direct' },
  }))
  await expect(inviteUserToTower('tower-id', '  New Friend  ')).resolves.toEqual({
    userId: 'member-id',
    delivery: 'direct',
  })
  expect(mockFetch).toHaveBeenCalledWith('/api/towers/tower-id/invitations', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'New Friend' }),
  })
})

test('surfaces descriptive server errors', async () => {
  mockFetch.mockResolvedValue(Response.json(
    { error: "You're already in this tower." },
    { status: 409 },
  ))
  await expect(inviteUserToTower('tower-id', 'me')).rejects.toThrow(
    "You're already in this tower.",
  )
})

test('accepts email-delivery success', async () => {
  mockFetch.mockResolvedValue(Response.json({
    data: { success: true, userId: 'new-user', delivery: 'email' },
  }))
  await expect(inviteUserToTower('tower-id', 'new@example.com')).resolves.toEqual({
    userId: 'new-user',
    delivery: 'email',
  })
})
