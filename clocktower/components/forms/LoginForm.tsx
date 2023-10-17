'use client'
import { Auth } from '@supabase/auth-ui-react' 
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SignOutButton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Provider, Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import {GenericLoadingSkeleton} from '@/components/loading/GenericLoadingSkeleton'
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

const providersENV = process.env.NEXT_PUBLIC_PROVIDERS || ''
const domain = process.env.NEXT_PUBLIC_DOMAIN || ''



export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [userSession,setUserSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  // see if user is logged in already
  //useEffect to see if the user is logged in 
  const getSession = async () => {
    const {data, error} = await supabase.auth.getSession()
    if(data.session && !error){
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
      if(!providersENV) throw new Error('No providers found in env')
      const providersArray = providersENV.split(',')
      providersArray.forEach(provider => {
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
  return (<>
    { isLoading ? ( <div className='flex items-center justify-center'> <GenericLoadingSkeleton /> </div>
    ) : (
      <div className="flex flex-col items-center justify-center w-full h-full">
        {userSession ? (
          <div className='flex flex-col items-center justify-center'>
          <h1> You are Logged in! </h1>
          <Button variant='destructive' onClick={handleSignOut}>Sign Out 👋 </Button>
        </div>
        ) : (
      <Tabs defaultValue="magicLink" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="magicLink">{"Magic Link 🧙‍♂️"}</TabsTrigger>
          <TabsTrigger value="signIn">{"Sign In 🧑‍💻"}</TabsTrigger>
          <TabsTrigger value="signUp">{"Sign Up 📝"}</TabsTrigger>
        </TabsList>
        <TabsContent value="magicLink">
          <Card>
            <CardHeader>
              <CardTitle>Magic Link</CardTitle>
              <CardDescription>Sign in or Sign up with a magic link to your email.</CardDescription>
            </CardHeader>
            <CardContent>
              <Auth
                supabaseClient={supabase}
                view="magic_link"
                appearance={{ theme: ThemeSupa }}
                theme="light"
                showLinks={false}
                providers={providers}
                redirectTo= {domain + "/api/v1/auth/callback"}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signIn">
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Sign in with your email and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Auth
                supabaseClient={supabase}
                view="sign_in"
                appearance={{ theme: ThemeSupa }}
                theme="light"
                showLinks={false}
                providers={providers}
                redirectTo={domain + "/api/v1/auth/callback"}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signUp">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account with an email and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <Auth
                supabaseClient={supabase}
                view="sign_up"
                appearance={{ theme: ThemeSupa }}
                theme="light"
                showLinks={false}
                providers={providers}
                redirectTo={domain + "/api/v1/auth/callback"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        )}
    </div>
    )
    }</>)  
}