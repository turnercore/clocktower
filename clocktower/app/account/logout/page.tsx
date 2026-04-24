'use client'
import { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase/client'
import { signOutSA } from './actions/signOutSA'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from '@/components/ui'

const LogoutPage = () => {
  const router = useRouter()
  const supabase = createClient()
  // redirect to home
  useEffect(() => {
    const signOut = async () => {
      try {
        // See if user is signed in
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        signOutSA()
        // Sign out on the client
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
        // Redirect to the home page
      } catch (error) {
        console.error(error)
      }
      toast({
        title: 'You are now signed out.',
        description: 'See you later! 👋',
      })
      router.push('/')
    }

    signOut()
  }, [])

  return <div>Signing Out</div>
}

export default LogoutPage
