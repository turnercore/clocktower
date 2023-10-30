'use client'
import { Button } from '@/components/ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import signOut from '@/lib/actions/signOut'
import { Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const signOutClient = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSignOut = () => {
    try {
      signOut()
      signOutClient()
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
