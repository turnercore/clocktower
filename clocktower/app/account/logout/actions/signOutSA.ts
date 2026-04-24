'use server'
import { createClient } from '@/lib/supabase/server'

export const signOutSA = async () => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) return { error }
  return {
    data: {
      success: true,
    },
  }
}
