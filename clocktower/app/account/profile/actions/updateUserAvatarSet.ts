'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type ReturnType = {
  success: boolean
}

export default async function updateUserAvatarSetSA(
  inputAvatarSet: string | number,
  inputUserId: UUID,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Get the form data into a javascript object

    // Validate data, should be a number or string of 1, 2, 3, 4
    const avatarSet =
      typeof inputAvatarSet === 'string'
        ? parseInt(inputAvatarSet)
        : inputAvatarSet

    if (![1, 2, 3, 4].includes(avatarSet)) {
      throw new Error('Invalid avatar set.')
    }

    UUIDSchema.parse(inputUserId)

    // init supabase
    const supabase = createServerActionClient({ cookies })
    // Update the user's avatar set in the database
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_set: avatarSet })
      .eq('id', inputUserId)

    // Handle error
    if (error) throw error

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
