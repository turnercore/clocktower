'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { cookies } from 'next/headers'

const inputSchema = z.object({
  userId: UUIDSchema,
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
    const { userId, newAvatarUrl } = result

    // Init Supabase
    const supabase = createServerActionClient({ cookies })

    // Update the user's avatar in the database
    const { error: updateAvatarError } = await supabase
      .from('profiles')
      .update({ avatar_url: newAvatarUrl })
      .match({ id: userId })

    // Handle error
    if (updateAvatarError) throw updateAvatarError

    // return data
    return { data: { newAvatarUrl } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
