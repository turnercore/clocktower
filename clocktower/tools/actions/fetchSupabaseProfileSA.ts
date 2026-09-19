'use server'
import type { Profile, ServerActionReturn } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'
import extractErrorMessage from '../extractErrorMessage'

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

    if (!profileData?.length) {
      return { data: await createNewProfile(userId) }
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

const createNewProfile = async (newProfileId: string): Promise<Profile> => {
  const supabase = await createClient()

  const newProfile = {
    id: newProfileId,
    username: `user-${newProfileId.replace(/-/g, '').slice(0, 16)}`,
    color: '#FFFFFF',
    avatar_set: 1,
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(newProfile)
    .select('*')
    .single()

  if (error) throw error
  return data as Profile
}

export default fetchSupabaseProfileSA
