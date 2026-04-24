'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  inputUserId: UUIDSchema,
  inputInvitedUsername: z.string(),
  inputTowerId: UUIDSchema,
})

type ReturnType = {
  success: true
}

export default async function serverActionSA({
  inputUserId,
  inputInvitedUsername,
  inputTowerId,
}: z.infer<typeof inputSchema>): Promise<ServerActionReturn<ReturnType>> {
  const supabase = await createClient()
  try {
    // Validate data
    const {
      inputUserId: userId,
      inputInvitedUsername: username,
      inputTowerId: towerId,
    } = inputSchema.parse({ inputUserId, inputInvitedUsername, inputTowerId })

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const requestingUserId = sessionData.session?.user.id
    if (!requestingUserId) throw new Error('Requesting user not found.')
    if (requestingUserId !== userId) {
      throw new Error('Requesting user does not match the active session.')
    }

    const { data: towerData, error: towerError } = await supabase
      .from('towers')
      .select('owner, admin_users, is_locked')
      .eq('id', towerId)
      .single()
    if (towerError) throw towerError

    const isOwner = towerData.owner === requestingUserId
    const isAdmin = towerData.admin_users?.includes(requestingUserId)
    const canInviteToTower = isOwner || (isAdmin && !towerData.is_locked)
    if (!canInviteToTower) {
      throw new Error('Requesting user does not have permission to invite users.')
    }

    // Check if the user with the entered username exists
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single()

    // Error handling
    if (profilesError || !profilesData)
      throw profilesError || new Error('User not found.')

    // Call the add_user_to_tower function to handle the rest
    const { error: addError } = await supabase.rpc('add_user_to_tower', {
      tower: towerId,
      new_user_id: profilesData.id,
    })

    if (addError) throw addError

    // Add entry in the friends table
    const { error: friendsInsertError } = await supabase
      .from('friends')
      .upsert([{ user_id: userId, friend_id: profilesData.id }])

    if (friendsInsertError) throw friendsInsertError

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
