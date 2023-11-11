import UpdateAccountForm from './components/UpdateAccountForm'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { ProfileRow, ProfileRowSchema } from '@/types/schemas'

export default async function AccountPage() {
  let profile: ProfileRow | null = null
  let isAnError = false
  let email = ''
  // Get the user profile data
  const supabase = createServerComponentClient<Database>({ cookies })
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError

    const userId = sessionData.session?.user?.id
    if (!userId) throw new Error('No user ID found in session data')
    email = sessionData.session?.user?.email || ''

    const { data: userProfileData, error: fetchProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (fetchProfileError) throw fetchProfileError
    profile = ProfileRowSchema.parse(userProfileData)
    if (!profile) throw new Error('No profile data found')
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
