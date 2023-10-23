"use client"
import { Button } from '@/components/ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SignOutButton() {
  const supabase = createClientComponentClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleSignOut = () => {
    try {
      signOut()
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <Button variant='destructive' onClick={() => handleSignOut()}>
        Sign Out
    </Button>
  )
}