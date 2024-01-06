'use server'
import type { Profile, ServerActionReturn } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import extractErrorMessage from '../extractErrorMessage'
import { generateUsername } from '../nameGenerators'

const fetchSupabaseProfileSA = async (
  userId: string,
): Promise<ServerActionReturn<Profile>> => {
  const supabase = createServerActionClient({ cookies })
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)

    if (profileError) throw profileError

    // If there is no profile data, then create a new profile
    if (
      !profileData ||
      profileData.length === 0 ||
      profileData[0] === undefined
    ) {
      createNewProfile(userId)
    }

    return { data: profileData[0] as Profile }
  } catch (error) {
    return {
      error: extractErrorMessage(
        error,
        'Unknown error from fetchSupabaseProfileSA.',
      ),
    }
  }
}

const createNewProfile = async (newProfileId: string) => {
  const supabase = createServerActionClient({ cookies })

  const newProfile = {
    id: newProfileId,
    username: generateUsername(),
    color: '#FFFFFF',
    avatar_set: 1,
    reduce_motion: false,
  }

  const { error } = await supabase.from('profiles').upsert(newProfile)

  if (error) throw error
}

export default fetchSupabaseProfileSA
