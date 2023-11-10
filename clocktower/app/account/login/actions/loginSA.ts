// Login and redirect user to the homepage
'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SignInWithPasswordCredentials } from '@supabase/supabase-js'
import extractErrorMessage from '@/tools/extractErrorMessage'

const inputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

interface inputType {
  email: string
  password: string
}

const LoginWithPasswordSA = async ({ email, password }: inputType) => {
  try {
    const supabase = createServerActionClient<Database>({ cookies })
    const credentials: SignInWithPasswordCredentials = {
      email,
      password,
    }
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    if (error) throw error

    return {
      data: {
        user: data.user,
        session: data.session,
      },
    }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unable to Login.'),
    }
  }
}
