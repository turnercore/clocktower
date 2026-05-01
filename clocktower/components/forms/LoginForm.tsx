'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { type Session } from '@supabase/supabase-js'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@/components/ui'
import { GenericLoadingSkeleton } from '@/components/loading/GenericLoadingSkeleton'

const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

type LoginFormProps = {
  onClick?: () => void
  redirectTo?: string
}

function getSafeRedirectPath(redirectTo?: string) {
  if (!redirectTo || !redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return ''
  }

  return redirectTo
}

export default function LoginForm({ onClick, redirectTo }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const loginFormSchema = z.object({
    email: z.string().email(),
  })

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    getSession()
  }, [])

  const getSession = async () => {
    if (!isSupabaseConfigured()) {
      setUserSession(null)
      setIsLoading(false)
      return false
    }

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

  async function signInWIthMagicLink(email: string) {
    const emailRedirectUrl = new URL('/api/auth/callback', domain || window.location.origin)
    const safeRedirectPath = getSafeRedirectPath(redirectTo)
    if (safeRedirectPath) {
      emailRedirectUrl.searchParams.set('from', safeRedirectPath)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: emailRedirectUrl.toString(),
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
      if (onClick) onClick()
      router.push('/magic')
    }
  }

  const handleSignOut = async () => {
    supabase.auth.signOut()
    getSession()
  }

  const onSubmit = (values: z.infer<typeof loginFormSchema>) => {
    signInWIthMagicLink(values.email)
  }

  //If the user is logged in return 'You are logged in' with the email and a sign out button
  return (
    <>
      {isLoading ? (
        <div className='flex items-center justify-center'>
          <GenericLoadingSkeleton />
        </div>
      ) : userSession ? (
        <div className='flex flex-col items-center justify-center w-full h-full'>
          <h1> You are Logged in! </h1>
          <h2> Email: {userSession.user.email} </h2>
          <Button variant='destructive' onClick={handleSignOut}>
            Sign Out 👋
          </Button>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center w-full h-full'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='flex flex-col space-y-4'>
                <div className='text-center'>
                  <h1 className='text-2xl'>Magic Login</h1>
                  <p>Sign in or sign up in one click with a magic email link.</p>
                </div>
                <div className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type='email' placeholder='Email' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='flex flex-row space-x-2 justify-between'>
                    <Button disabled={!form.watch('email')} type='submit'>
                      Magic Sign In 🪄
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
      )}
    </>
  )
  
}
