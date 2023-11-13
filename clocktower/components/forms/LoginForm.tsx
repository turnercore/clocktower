'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button, Input } from '@/components/ui'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { GenericLoadingSkeleton } from '@/components/loading/GenericLoadingSkeleton'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Database } from '@/types/supabase'

// const providersENV = process.env.NEXT_PUBLIC_PROVIDERS || ''
const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const supabase = createClientComponentClient<Database>()
  const url = new URL('/api/auth/callback', domain)
  const theme = useTheme().resolvedTheme
  const router = useRouter()

  // see if user is logged in already
  //useEffect to see if the user is logged in
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (data.session && !error) {
      setUserSession(data.session)
      setIsLoading(false)
      return true
    } else {
      setUserSession(null)
      setIsLoading(false)
      return false
    }
  }

  useEffect(() => {
    getSession()
  }, [])

  async function signInWithEmail() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) console.error(error)

    router.refresh()
  }

  async function signUpWithEmail() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) console.error(error)

    router.push('/welcome')
  }

  async function signInWIthMagicLink() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: domain + '/api/auth/callback',
      },
    })
    if (error) console.error(error)

    router.push('/🪄')
  }

  const handleSignOut = async () => {
    supabase.auth.signOut()
    getSession()
  }

  //If the user is logged in return 'You are logged in' with the email and a sign out button
  return (
    <>
      {isLoading ? (
        <div className='flex items-center justify-center'>
          {' '}
          <GenericLoadingSkeleton />{' '}
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center w-full h-full'>
          {userSession ? (
            <>
              <h1> You are Logged in! </h1>
              <h2> Email: {userSession.user.email} </h2>
              <Button variant='destructive' onClick={handleSignOut}>
                Sign Out 👋
              </Button>
            </>
          ) : (
            <div className='flex flex-col space-y-4'>
              <div className='text-center'>
                <h1 className='text-2xl'>Login or SignUp</h1>
              </div>
              <div className='space-y-4'>
                <Input
                  type='email'
                  placeholder='Email'
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type='password'
                  placeholder='Password'
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className='flex flex-row space-x-2 justify-between'>
                  <Button onClick={signInWithEmail}>Sign In</Button>
                  <Button onClick={signUpWithEmail}>Sign Up</Button>
                </div>
                <div className='flex flex-col items-center'>
                  <Button onClick={signInWIthMagicLink}>
                    Sign In With Magic 🪄
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
