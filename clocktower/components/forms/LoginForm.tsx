'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button, Input, toast } from '@/components/ui'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { GenericLoadingSkeleton } from '@/components/loading/GenericLoadingSkeleton'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'

// const providersENV = process.env.NEXT_PUBLIC_PROVIDERS || ''
const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const supabase = createClientComponentClient<Database>()
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
    if (error) {
      console.error(error)
      toast({
        title: 'Error Signing In',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success!',
        description: 'You are now logged in. Look at you :)',
      })
      router.refresh()
    }
  }

  async function signUpWithEmail() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      console.error(error)
      toast({
        title: 'Error Signing Up',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      router.push('/welcome')
    }
  }

  async function signInWIthMagicLink() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: domain + '/api/auth/callback',
      },
    })
    if (error) {
      console.error(error)
      toast({
        title: 'Error Signing In',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      router.push('/magic')
    }
  }

  const handleSignOut = async () => {
    supabase.auth.signOut()
    getSession()
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password) {
      signInWithEmail()
    } else {
      signInWIthMagicLink()
    }
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
            <form onSubmit={handleSubmit}>
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
                    <Button
                      disabled={!email}
                      type='submit'
                      // onClick={password ? signInWithEmail : signInWIthMagicLink}
                    >
                      {password ? 'Sign In' : 'Magic Sign In 🪄'}
                    </Button>
                    <Button
                      disabled={email && password ? false : true}
                      onClick={signUpWithEmail}
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  )
}
