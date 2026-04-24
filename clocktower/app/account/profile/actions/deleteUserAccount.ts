'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn } from '@/types/schemas'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

type ReturnType = {
  success: boolean
}

const supabaseURL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'TODO: Your Supabase URL'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY || 'TODO: Your Supabase Key'

export default async function deleteUserAccount(
  _formData: FormData,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Delete the user from auth
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('You must be signed in to delete your account.')

    const supabaseAdmin = createSupabaseAdminClient(supabaseURL, supabaseServiceKey)
    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id, false)
    if (deleteAuthError) throw deleteAuthError

    // Sign the user out
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError

    // Clean up the user's data if needed (Delete cascade will take care of this, I believe)

    // Return success
    return { data: { success: true } }
  } catch (error) {
    return { error: extractErrorMessage(error), data: { success: false } }
  }
}
