'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const inputSchema = z.object({
  newAvatarUrl: z.string().url(),
})

type ReturnType = {
  newAvatarUrl: string
}

export default async function updateUserAvatarSA(
  formData: FormData,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())

    // Validate data
    const result = inputSchema.parse(form)

    // If we get here, the data is valid and can be used exactly as you would expect
    // to use it in the rest of your server action.
    const { newAvatarUrl } = result

    // Init Supabase
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('You must be signed in to update your avatar.')

    // Update the user's avatar in the database
    const { error: updateAvatarError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl } as never)
      .match({ id: user.id })

    // Handle error
    if (updateAvatarError) throw updateAvatarError

    // return data
    return { data: { newAvatarUrl } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
