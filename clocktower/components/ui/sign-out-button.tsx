"use client"
import { Button } from '@/components/ui'
import type { SupabaseClient } from '@supabase/supabase-js'

export function SignOutButton(supabase_auth: SupabaseClient['auth']) {
  const signOut = async () => {
    await supabase_auth.signOut()
  }

  const handleSignOut = () => {
    try {
      signOut()
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Button variant='destructive' onClick={() => handleSignOut()}>
      Sign Out
    </Button>
  )
}
