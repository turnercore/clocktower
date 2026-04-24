'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'

type ReturnType = {
  success: boolean
}

export default async function updateUserAvatarSetSA(
  inputAvatarSet: string | number,
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

    // init supabase
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user)
      throw new Error('You must be signed in to update your avatar set.')

    // Update the user's avatar set in the database
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_set: avatarSet })
      .eq('id', user.id)

    // Handle error
    if (error) throw error

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
