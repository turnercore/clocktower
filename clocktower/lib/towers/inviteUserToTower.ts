import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTowerInviteToken } from './towerInviteToken'

const rawInputSchema = z.object({
  towerId: z.string().uuid('Invalid tower ID.'),
  identifier: z.string().optional(),
  username: z.string().optional(),
  expectedUserId: z.string().uuid('Invalid requesting user ID.').optional(),
  appOrigin: z.string().url('Invalid application URL.').optional(),
})

export type InvitationResult = {
  status: number
  body:
    | { data: { success: true; userId: string; delivery: 'direct' | 'email' } }
    | { error: string }
}

type InviteTarget = { user_id: string; email_confirmed: boolean }

function failure(status: number, error: string): InvitationResult {
  return { status, body: { error } }
}

type ParsedIdentifier =
  | { ok: false; error: string }
  | {
      ok: true
      towerId: string
      identifier: string
      isEmail: boolean
      expectedUserId?: string
      appOrigin?: string
    }

function parseIdentifier(input: unknown): ParsedIdentifier {
  const parsed = rawInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const identifier = (parsed.data.identifier ?? parsed.data.username ?? '').trim()
  if (!identifier) {
    return { ok: false, error: 'Enter a username or email address.' }
  }

  const isEmail = z.string().email().safeParse(identifier).success
  if (isEmail && identifier.length > 320) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (!isEmail && identifier.length > 30) {
    return { ok: false, error: 'Username must be at most 30 characters.' }
  }

  return {
    ok: true,
    towerId: parsed.data.towerId,
    identifier,
    isEmail,
    expectedUserId: parsed.data.expectedUserId,
    appOrigin: parsed.data.appOrigin,
  }
}

function duplicateMessage(isSelf: boolean, isEmail: boolean, emailConfirmed: boolean) {
  if (isSelf) return "You're already in this tower."
  if (isEmail && !emailConfirmed) return 'This email has already been invited to this tower.'
  return 'This user is already in the tower.'
}

function inviteRedirect(token: string, appOrigin?: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_DOMAIN || appOrigin
  if (!configuredOrigin) return null
  try {
    const url = new URL('/', configuredOrigin)
    url.searchParams.set('tower_invite_token', token)
    return url.toString()
  } catch {
    return null
  }
}

function mapMembershipError(error: { code?: string; message?: string }) {
  if (error.code === '42501') return failure(403, 'You do not have permission to invite users to this tower.')
  if (error.code === 'P0002') return failure(404, 'The tower or user no longer exists.')
  if (error.code === '22004') return failure(400, 'A tower and user are required.')
  if (error.code === '23505' || error.message?.includes('already the owner or a member')) {
    return failure(409, 'This user is already in the tower.')
  }
  return failure(500, 'Unable to invite the user. Please try again.')
}

export async function inviteUserToTower(input: unknown): Promise<InvitationResult> {
  const parsed = parseIdentifier(input)
  if (!parsed.ok) return failure(400, parsed.error)
  const { towerId, identifier, isEmail, expectedUserId, appOrigin } = parsed

  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError?.status === 0 || (authError?.status ?? 0) >= 500) {
      return failure(503, 'Unable to check your session. Please try again.')
    }

    const requestingUserId = authData.user?.id
    if (authError || !requestingUserId) return failure(401, 'Please sign in to invite users.')
    if (expectedUserId && expectedUserId !== requestingUserId) {
      return failure(403, 'Requesting user does not match the active session.')
    }

    const { data: tower, error: towerError } = await supabase
      .from('towers')
      .select('owner, users, admin_users, is_locked')
      .eq('id', towerId)
      .maybeSingle()
    if (towerError) return failure(500, 'Unable to load the tower. Please try again.')
    if (!tower) return failure(404, 'Tower not found or you do not have access.')

    const canInvite =
      tower.owner === requestingUserId ||
      (tower.admin_users?.includes(requestingUserId) && !tower.is_locked)
    if (!canInvite) return failure(403, 'You do not have permission to invite users to this tower.')

    const resolveTarget = async () => {
      const { data, error } = await supabase.rpc('find_tower_invite_target', {
        tower: towerId,
        identifier,
        lookup_by_email: isEmail,
      })
      if (error) return { error } as const
      return { matches: (data ?? []) as InviteTarget[] } as const
    }

    const addMembership = async (
      target: InviteTarget,
      delivery: 'direct' | 'email',
    ): Promise<InvitationResult> => {
      const isSelf = target.user_id === requestingUserId
      if (isSelf || tower.users?.includes(target.user_id)) {
        return failure(409, duplicateMessage(isSelf, isEmail, target.email_confirmed))
      }

      const { error: addError } = await supabase.rpc('add_user_to_tower', {
        tower: towerId,
        new_user_id: target.user_id,
      })
      if (addError) return mapMembershipError(addError)

      try {
        const { error: friendsError } = await supabase.from('friends').upsert(
          [{ user_id: requestingUserId, friend_id: target.user_id }],
          { onConflict: 'user_id,friend_id', ignoreDuplicates: true },
        )
        if (friendsError) console.warn('User invited, but the friends list could not be updated.', friendsError)
      } catch (error) {
        console.warn('User invited, but the friends list could not be updated.', error)
      }

      return { status: 200, body: { data: { success: true, userId: target.user_id, delivery } } }
    }

    const resolved = await resolveTarget()
    if ('error' in resolved) return failure(500, 'Unable to find the user. Please try again.')
    if (resolved.matches.length > 1) {
      return failure(
        409,
        isEmail
          ? 'More than one account has this email address.'
          : 'More than one user has that username. Ask them to choose a unique username.',
      )
    }
    if (resolved.matches.length === 1) return addMembership(resolved.matches[0], 'direct')

    if (!isEmail) {
      return failure(404, 'No user found with that username. Enter their email address to send an invitation.')
    }

    let inviteToken: string
    try {
      inviteToken = createTowerInviteToken(towerId, identifier)
    } catch {
      return failure(503, 'Email invitations are not configured correctly.')
    }

    const redirectTo = inviteRedirect(inviteToken, appOrigin)
    if (!redirectTo) return failure(503, 'Email invitations are not configured correctly.')

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return failure(503, 'Email invitations are not configured correctly.')
    }

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(identifier, { redirectTo })

    if (inviteError) {
      const raced = await resolveTarget()
      if (!('error' in raced) && raced.matches.length === 1) {
        return addMembership(raced.matches[0], 'direct')
      }
      if (inviteError.status === 429) {
        return failure(429, 'Too many invitation emails were sent recently. Try again in a little while.')
      }
      return failure(502, 'Clocktower could not send the invitation email. Please try again.')
    }

    const invitedUserId = invited.user?.id
    if (!invitedUserId) return failure(502, 'Clocktower sent an incomplete invitation response. Please try again.')

    const result = await addMembership(
      { user_id: invitedUserId, email_confirmed: false },
      'email',
    )
    if (result.status !== 200) {
      console.warn(
        'Invitation email sent before membership committed; acceptance will repair membership.',
        result.body,
      )
    }

    return {
      status: 200,
      body: {
        data: {
          success: true,
          userId: invitedUserId,
          delivery: 'email',
        },
      },
    }
  } catch (error) {
    console.error('Tower invitation failed.', error)
    return failure(500, 'Unable to invite the user. Please try again.')
  }
}
