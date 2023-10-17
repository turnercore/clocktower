"use client"
import { Button } from '@/components/ui'
import { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

export function SignOutButton(supabase_auth: SupabaseAuthClient) {
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