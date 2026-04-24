'use server'
import { createClient } from '@/lib/supabase/server'

export default async function isUserAuthenticated() {
  try {
    const supabase = await createClient()
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
