'use server'
import type { Profile, ServerActionReturn } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'
import extractErrorMessage from '../extractErrorMessage'
import { generateUsername } from '../nameGenerators'

const fetchSupabaseProfileSA = async (
  userId: string,
): Promise<ServerActionReturn<Profile>> => {
  const supabase = await createClient()
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
  const supabase = await createClient()

  const newProfile = {
    id: newProfileId,
    username: generateUsername(),
    color: '#FFFFFF',
    avatar_set: 1,
  }

  const { error } = await supabase.from('profiles').upsert(newProfile)

  if (error) throw error
}

export default fetchSupabaseProfileSA
