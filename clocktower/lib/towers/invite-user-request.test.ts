import { inviteUserToTower } from './invite-user-request'

const originalFetch = global.fetch
const mockFetch = jest.fn()

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch
})

afterAll(() => {
  global.fetch = originalFetch
})

test('uses the stable JSON endpoint and trims the username', async () => {
  mockFetch.mockResolvedValue(Response.json({ data: { success: true, userId: 'member-id' } }))
  await expect(inviteUserToTower('tower-id', '  New Friend  ')).resolves.toEqual({ userId: 'member-id' })
  expect(mockFetch).toHaveBeenCalledWith('/api/towers/tower-id/invitations', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'New Friend' }),
  })
})

test('shows server validation and permission errors', async () => {
  mockFetch.mockResolvedValue(Response.json({ error: 'You cannot invite users to this tower.' }, { status: 403 }))
  await expect(inviteUserToTower('tower-id', 'friend')).rejects.toThrow('You cannot invite users to this tower.')
})

test('handles HTML error pages during an unavailable deployment', async () => {
  mockFetch.mockResolvedValue(new Response('<html>Not Found</html>', { status: 404 }))
  await expect(inviteUserToTower('tower-id', 'friend')).rejects.toThrow('Refresh the page and try again.')
})

test('does not report success for an unexpected response', async () => {
  mockFetch.mockResolvedValue(Response.json({ data: { success: true } }))
  await expect(inviteUserToTower('tower-id', 'friend')).rejects.toThrow('Could not confirm the invitation.')
})

test('surfaces network errors without automatically repeating the mutation', async () => {
  mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(inviteUserToTower('tower-id', 'friend')).rejects.toThrow('Check your connection and try again.')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})
