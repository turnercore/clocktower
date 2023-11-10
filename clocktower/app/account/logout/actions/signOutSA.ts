'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export const signOutSA = async () => {
  const supabase = createServerActionClient<Database>({ cookies })
  const { error } = await supabase.auth.signOut()
  if (error) return { error }
  return {
    data: {
      success: true,
    },
  }
}
