'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { z } from 'zod'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const inputSchema = z.object({
  inputUserId: UUIDSchema,
  inputInvitedUsername: z.string(),
  inputTowerId: z.string(),
})

type ReturnType = {
  success: true
}

export default async function serverActionSA({
  inputUserId,
  inputInvitedUsername,
  inputTowerId,
}: z.infer<typeof inputSchema>): Promise<ServerActionReturn<ReturnType>> {
  const supabase = createServerActionClient({ cookies })
  try {
    // Validate data
    const {
      inputUserId: userId,
      inputInvitedUsername: username,
      inputTowerId: towerId,
    } = inputSchema.parse({ inputUserId, inputInvitedUsername, inputTowerId })

    // If we get here, the data is valid and can be used exactly as you would expect
    // to use it in the rest of your server action.

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
