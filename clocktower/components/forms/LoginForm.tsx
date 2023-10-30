'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui'
import { Provider, Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { GenericLoadingSkeleton } from '@/components/loading/GenericLoadingSkeleton'
import Router, { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

const providersENV = process.env.NEXT_PUBLIC_PROVIDERS || ''
const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()
  const path = usePathname()
  const url = new URL(path, domain)
  const theme = useTheme().resolvedTheme

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

  //Split providers by , and add each to the providers list
  const providers = [] as Provider[]
  try {
    //This isn't really an error, maybe remove error and just make it empty array.
    if (!providersENV) throw new Error('No providers found in env')
    const providersArray = providersENV.split(',')
    providersArray.forEach((provider) => {
      providers.push(provider as Provider)
    })
  } catch (error: any) {
    console.error(error.message)
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
            <Auth
              supabaseClient={supabase}
              view='sign_in'
              magicLink={true}
              appearance={{ theme: ThemeSupa }}
              theme={theme === 'dark' ? 'dark' : 'light'}
              showLinks={true}
              providers={providers}
              redirectTo={domain + '/api/auth/callback'}
              queryParams={{ from: url.toString() }}
            />
          )}
        </div>
      )}
    </>
  )
}
