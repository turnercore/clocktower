'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  HexColorCodeSchema,
  ProfileRow,
  ServerActionReturn,
} from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { openaiModeration } from '@/tools/openaiModeration'

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
  color: HexColorCodeSchema.optional(),
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must be less than 30 characters. COME ON!' })
    .optional(),
})

type ReturnType = { success: boolean }

export default async function updateUserDataSA(
  formData: FormData,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())
    console.log('form', form)

    // Validate data
    const result = inputSchema.parse(form)

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
      if (updatePasswordError) throw new Error('Error updating password.')
    }

    // Update the rest of the user's data in the 'profiles' table
    const userData: Partial<ProfileRow> = {}
    // If the user is changing their username make sure it is unique
    if (username) {
      // Moderate the username
      const input = new FormData()
      input.append('input', username)
      const { data: flagged } = await openaiModeration(input)
      if (flagged) throw new Error('Username is not allowed.')

      // First check to make sure the username is not in use, we'll have to use the admin account to do this
      const { data: existingUser } = await supabase
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

    if (updateProfileError) throw updateProfileError

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
