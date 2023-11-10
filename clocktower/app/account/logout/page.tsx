'use client'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { signOutSA } from './actions/signOutSA'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LogoutPage = () => {
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
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
      router.push('/')
    }

    signOut()
  }, [])

  return <div>Signing Out</div>
}

export default LogoutPage
