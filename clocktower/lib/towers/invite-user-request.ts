export async function inviteUserToTower(towerId: string, username: string) {
  let response: Response
  try {
    response = await fetch(`/api/towers/${encodeURIComponent(towerId)}/invitations`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() }),
    })
  } catch {
    throw new Error('Could not reach Clocktower. Check your connection and try again.')
  }

  const result = await response.json().catch(() => null)
  if (!response.ok || result?.data?.success !== true) {
    throw new Error(
      typeof result?.error === 'string'
        ? result.error
        : 'Could not invite this user. Refresh the page and try again.',
    )
  }
  if (typeof result.data.userId !== 'string') {
    throw new Error('Could not confirm the invitation. Refresh the page to check tower access.')
  }

  return { userId: result.data.userId as string }
}
