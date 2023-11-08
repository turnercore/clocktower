'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ProfileRow, ServerActionReturn } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Define the input schema outside the function for reusability
const inputSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  confirmEmail: z.string().email().optional(),
  password: z
    .string()
    .min(8, {
      message: 'Password must be at least 8 characters.',
    })
    .optional(),
  confirmPassword: z
    .string()
    .min(8, { message: 'Passwords must match.' })
    .optional(),
  color: z.string().optional(),
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must be less than 30 characters. COME ON!' })
    .optional(),
})

type ReturnType = { success: boolean }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

export default async function updateUserDataSA(
  formData: FormData,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())
    console.log('form', form)

    // Validate data
    const result = inputSchema.parse(form)

    // If we get here, the data is valid and can be used exactly as you would expect
    // to use it in the rest of your server action.

    //init supabase
    const supabase = createServerActionClient({ cookies })

    const {
      userId,
      email,
      confirmEmail,
      password,
      confirmPassword,
      color,
      username,
    } = result

    // Update the user's email in the auth database if required
    if (email && confirmEmail) {
      if (email !== confirmEmail) throw new Error('Emails did not match.')

      const { error: updateEmailError } = await supabase.auth.updateUser({
        email,
      })
      if (updateEmailError) throw updateEmailError
    }

    // Update the user's password in the auth database if required
    if (password && confirmPassword) {
      if (password !== confirmPassword)
        throw new Error('Passwords did not match.')

      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password,
      })
      if (updatePasswordError) throw updatePasswordError
    }

    // Update the rest of the user's data in the 'profiles' table
    const userData: Partial<ProfileRow> = {}
    // If the user is changing their username make sure it is unique
    if (username) {
      // First check to make sure the username is not in use, we'll have to use the admin account to do this
      if (!supabaseUrl || !supabaseServiceKey)
        throw new Error(
          'Supabase creds not defined in server environment, unable to process',
        )
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .ilike('username', username)
      if (existingUser && existingUser.length > 0)
        throw new Error('Username already exists.')

      // If we get here, the username is unique, so we can update it
      userData['username'] = username
    }
    // Update the user's color
    if (color) userData['color'] = color

    // Update it on the server now
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', userId)
      .single()

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
