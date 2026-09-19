import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  towerId: z.string().uuid('Invalid tower ID.'),
  username: z
    .string({ required_error: 'Enter a username.' })
    .trim()
    .min(1, 'Enter a username.')
    .max(30, 'Username must be at most 30 characters.'),
  expectedUserId: z.string().uuid('Invalid requesting user ID.').optional(),
})

export type InvitationResult = {
  status: number
  body:
    | { data: { success: true; userId: string } }
    | { error: string }
}

function failure(status: number, error: string): InvitationResult {
  return { status, body: { error } }
}

export async function inviteUserToTower(input: unknown): Promise<InvitationResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(400, parsed.error.issues[0].message)
  }

  const { towerId, username, expectedUserId } = parsed.data

  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError?.status === 0 || (authError?.status ?? 0) >= 500) {
      console.error('Unable to authenticate tower invitation.', authError)
      return failure(503, 'Unable to check your session. Please try again.')
    }
    const requestingUserId = authData.user?.id
    if (authError || !requestingUserId) {
      return failure(401, 'Please sign in to invite users.')
    }
    if (expectedUserId && expectedUserId !== requestingUserId) {
      return failure(403, 'Requesting user does not match the active session.')
    }

    const { data: tower, error: towerError } = await supabase
      .from('towers')
      .select('owner, admin_users, is_locked')
      .eq('id', towerId)
      .maybeSingle()
    if (towerError) {
      console.error('Unable to load tower for invitation.', towerError)
      return failure(500, 'Unable to load the tower. Please try again.')
    }
    if (!tower) {
      return failure(404, 'Tower not found or you do not have access.')
    }
    const canInvite =
      tower.owner === requestingUserId ||
      (tower.admin_users?.includes(requestingUserId) && !tower.is_locked)
    if (!canInvite) {
      return failure(403, 'You do not have permission to invite users to this tower.')
    }

    // PostgREST's ILIKE also treats "*" as a wildcard. An anchored, escaped
    // case-insensitive regex keeps every character in the username literal.
    const usernamePattern = `^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .filter('username', 'imatch', usernamePattern)
      .limit(2)
    if (profilesError) {
      console.error('Unable to find user for tower invitation.', profilesError)
      return failure(500, 'Unable to find the user. Please try again.')
    }
    if (!profiles?.length) {
      return failure(404, 'No user found with that username.')
    }
    if (profiles.length > 1) {
      return failure(
        409,
        'More than one user has that username. Ask them to choose a unique username.',
      )
    }

    const invitedUserId = profiles[0].id
    const { error: addError } = await supabase.rpc('add_user_to_tower', {
      tower: towerId,
      new_user_id: invitedUserId,
    })
    if (addError) {
      if (addError.code === '42501') {
        return failure(403, 'You do not have permission to invite users to this tower.')
      }
      if (addError.code === 'P0002') {
        return failure(404, 'The tower or user no longer exists.')
      }
      if (addError.code === '22004') {
        return failure(400, 'A tower and user are required.')
      }
      if (addError.code === '23505') {
        return failure(409, 'This user is already in the tower.')
      }
      console.error('Unable to add user to tower.', addError)
      return failure(500, 'Unable to invite the user. Please try again.')
    }

    // Membership has committed. A failed friends update must not report the
    // invitation as failed, including when the request throws a transport error.
    try {
      const { error: friendsError } = await supabase.from('friends').upsert(
        [{ user_id: requestingUserId, friend_id: invitedUserId }],
        { onConflict: 'user_id,friend_id', ignoreDuplicates: true },
      )
      if (friendsError) {
        console.warn('User invited, but the friends list could not be updated.', friendsError)
      }
    } catch (error) {
      console.warn('User invited, but the friends list could not be updated.', error)
    }

    return { status: 200, body: { data: { success: true, userId: invitedUserId } } }
  } catch (error) {
    console.error('Tower invitation failed.', error)
    return failure(500, 'Unable to invite the user. Please try again.')
  }
}
