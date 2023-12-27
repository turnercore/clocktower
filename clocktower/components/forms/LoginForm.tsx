'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
import { type Database } from '@/types/supabase'

const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

export default function LoginForm({ onClick }: { onClick?: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const [usePassword, setUsePassword] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const loginFormSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  }).refine((data) => {
    if (usePassword) {
      // Validate the password only if usePassword is true
      return data.password.length >= 6
    } else {
      // If usePassword is false, set password to an empty string
      data.password = ''
      return true
    }
  }, {
    message: "Password must be at least 6 characters long",
    path: ["password"], // This specifies that the error message is specifically for the password field
  })

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    getSession()
  }, [])

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

  async function signInWithEmail(email: string, password: string) {
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
      if (onClick) onClick()
      router.refresh()
    }
  }

  async function signUpWithEmail() {
    const email = form.getValues('email')
    const password = form.getValues('password')
    if (!email || !password || password.length < 6)
      return toast({
        title: 'Error Signing Up',
        description:
          'Please enter a valid email and password. Your password must be at least 6 characters long.',
        variant: 'destructive',
      })

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
      if (onClick) onClick()
      router.push('/welcome')
    }
  }

  async function signInWIthMagicLink(email: string) {
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
      if (onClick) onClick()
      router.push('/magic')
    }
  }

  const handleSignOut = async () => {
    supabase.auth.signOut()
    getSession()
  }

  const onSubmit = (values: z.infer<typeof loginFormSchema>) => {
    if (usePassword) {
      signInWithEmail(values.email, values.password || '')
    } else {
      signInWIthMagicLink(values.email)
    }
  }

  const toggleUsePassword = () => {
    setUsePassword(!usePassword)
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
                  <h1 className='text-2xl'>{usePassword ? 'Login' : 'Magic Login'}</h1>
                  <p>{!usePassword ? 'Sign in or Sign up in one click with a magic email link.' : ''}</p>
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
                  {usePassword && (
                    <FormField
                      control={form.control}
                      name='password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type='password' placeholder='Password' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className='flex flex-row space-x-2 justify-between'>
                    <Button disabled={!form.watch('email')} type='submit'>
                      {usePassword ? 'Sign In' : 'Magic Sign In 🪄'}
                    </Button>
                    { usePassword ? <Button disabled={!form.watch('email')} onClick={signUpWithEmail} >Sign Up</Button> : <></> }
                    <Button onClick={toggleUsePassword}>
                      {usePassword ? 'Magic Link' : 'Use Password'}
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
