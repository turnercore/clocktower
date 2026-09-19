export type TowerInvitationDelivery = 'direct' | 'email'

export async function inviteUserToTower(towerId: string, identifier: string) {
  let response: Response
  try {
    response = await fetch(`/api/towers/${encodeURIComponent(towerId)}/invitations`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim() }),
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

  const userId = result?.data?.userId
  const delivery = result?.data?.delivery
  if (
    typeof userId !== 'string' ||
    (delivery !== 'direct' && delivery !== 'email')
  ) {
    throw new Error(
      'Could not confirm the invitation. Refresh the page to check tower access.',
    )
  }

  return { userId, delivery: delivery as TowerInvitationDelivery }
}
