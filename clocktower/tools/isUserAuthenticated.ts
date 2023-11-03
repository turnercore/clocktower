'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function isUserAuthenticated() {
  try {
    const supabase = createServerActionClient({ cookies })
    const { data, error } = await supabase.auth.getSession()
    const session = data?.session
    const user = session?.user

    if (user && !error) {
      return true
    } else {
      return false
    }
  } catch {
    return false
  }
}
