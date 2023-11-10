'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const inputSchema = z.object({
  userId: UUIDSchema,
})

type ReturnType = {
  success: boolean
}

const supabaseURL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'TODO: Your Supabase URL'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY || 'TODO: Your Supabase Key'

export default async function deleteUserAccount(
  formData: FormData,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())

    // Validate data
    const result = inputSchema.safeParse(form)
    if (!result.success) {
      return {
        error: extractErrorMessage(result.error),
        data: { success: false },
      }
    }
    const { userId } = result.data

    // Delete the user from auth
    const supabaseAdmin = createClient(supabaseURL, supabaseServiceKey)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(userId, false)

    // Sign the user out
    const supabase = createServerActionClient({ cookies })
    const { error: signOutError } = await supabase.auth.signOut()

    // Clean up the user's data if needed (Delete cascade will take care of this, I believe)

    // Return success
    return { data: { success: true } }
  } catch (error) {
    return { error: extractErrorMessage(error), data: { success: false } }
  }
}
