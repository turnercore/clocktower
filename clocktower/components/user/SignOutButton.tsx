'use client'
import { Button } from '@/components/ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type Database } from '@/types/supabase'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const signOut = async () => {
    // Sign out on the client
    await supabase.auth.signOut()
    // Redirect to the home page
    router.push('/')
  }

  const handleSignOut = () => {
    try {
      signOut()
    } catch (error) {
      console.error(error)
      router.push('/api/auth/logout')
    }
  }

  return (
    <Button variant='destructive' onClick={() => handleSignOut()}>
      Sign Out
    </Button>
  )
}
