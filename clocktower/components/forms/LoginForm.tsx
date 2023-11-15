'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { GenericLoadingSkeleton } from '@/components/loading/GenericLoadingSkeleton'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const domain = process.env.NEXT_PUBLIC_DOMAIN || ''

//TODO add zod validation to the form
const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
})

export default function LoginForm({ onClick }: { onClick?: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession, setUserSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  //Form
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

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
    if (values.password) {
      signInWithEmail(values.email, values.password)
    } else {
      signInWIthMagicLink(values.email)
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className='flex flex-col space-y-4'>
                  <div className='text-center'>
                    <h1 className='text-2xl'>Login or SignUp</h1>
                  </div>
                  <div className='space-y-4'>
                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type='email'
                              placeholder='Email'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='password'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type='password'
                              placeholder='Password'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='flex flex-row space-x-2 justify-between'>
                      <Button disabled={!form.watch('email')} type='submit'>
                        {form.watch('password')
                          ? 'Sign In'
                          : 'Magic Sign In 🪄'}
                      </Button>
                      <Button
                        disabled={
                          form.watch('email') && form.watch('password')
                            ? false
                            : true
                        }
                        onClick={signUpWithEmail}
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      )}
    </>
  )
}
