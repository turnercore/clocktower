'use server'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// This function only removes the refresh token for the JWT, must do client side sign out to remove the access token from local storage
export default async function signOut() {
  try {
    const supabase = createServerActionClient<Database>({ cookies })
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
    return { success: true }
  } catch (error) {
    return { error }
  }
}
