import UpdateAccountForm from './components/UpdateAccountForm'
import { createClient } from '@/lib/supabase/server'
import { ProfileRow, ProfileRowSchema } from '@/types/schemas'
import { isSupabaseConfigured } from '@/lib/supabase/config'

export default async function AccountPage() {
  let profile: ProfileRow | null = null
  let isAnError = false
  let email = ''
  // Get the user profile data
  if (!isSupabaseConfigured()) {
    isAnError = true
  }

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient()
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      const userId = userData.user?.id
      if (!userId) throw new Error('No user ID found in auth data')
      email = userData.user?.email || ''

      const { data: userProfileData, error: fetchProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (fetchProfileError) throw fetchProfileError
      profile = ProfileRowSchema.parse(userProfileData)
      if (!profile) throw new Error('No profile data found')
    }
  } catch (error) {
    console.error(error)
    isAnError = true
  }

  return (
    <div className='min-h-screen mb-[250px]'>
      {!isAnError && profile && (
        <UpdateAccountForm profile={profile} email={email} />
      )}
    </div>
  )
}
