'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from '@/components/ui'
import { SwatchesPicker } from '@/components/ui/color-picker'
import { type ProfileRow } from '@/types/schemas'
import { BsTrash3Fill } from 'react-icons/bs'
import updateUserAvatarSA from '../actions/updateUserAvatar'
import updateUserDataSA from '../actions/updateUserData'
import deleteUserAccount from '../actions/deleteUserAccount'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import { AvatarFallback } from '@radix-ui/react-avatar'

// validation schema for form
const formSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, 'New Username must be at least 2 characters.')
      .max(30, 'New Username must be under 30 characters, COME ON!')
      .or(z.literal('')) // Accept an empty string as valid
      .transform((str) => str.replace(/\s+/g, '')) // This will remove all whitespace
      .optional(),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .or(z.literal('')) // Accept an empty string as valid
      .transform((str) => str.replace(/\s+/g, '')) // This will remove all whitespace
      .optional(),
    confirmEmail: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .or(z.literal('')) // Accept an empty string as valid
      .transform((str) => str.replace(/\s+/g, '')) // This will remove all whitespace
      .optional(),
    password: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .or(z.literal('')) // Accept an empty string as valid
      .optional(),
    confirmPassword: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .or(z.literal('')) // Accept an empty string as valid
      .optional(),
    color: z
      .string()
      .trim()
      .email('Please enter a valid email address')
      .or(z.literal('')) // Accept an empty string as valid
      .transform((str) => str.replace(/\s+/g, '')) // This will remove all whitespace
      .optional(),
  })
  .superRefine(
    ({ confirmPassword, password, email, confirmEmail, username }, ctx) => {
      if (password) {
        if (confirmPassword !== password) {
          ctx.addIssue({
            code: 'custom',
            message: 'The passwords did not match.',
          })
        }
        if (password.length < 8) {
          ctx.addIssue({
            code: 'custom',
            message: 'Password must be at least 8 characters.',
          })
        }
      }

      if (email) {
        if (confirmEmail !== email) {
          ctx.addIssue({
            code: 'custom',
            message: 'The emails did not match.',
          })
        }
      }

      if (username) {
        if (username.length < 2) {
          ctx.addIssue({
            code: 'custom',
            message: 'Username must be at least 2 characters.',
          })
          if (username.length > 30) {
            ctx.addIssue({
              code: 'custom',
              message: 'Username must be less than 30 characters, COME ON!',
            })
          }
        }
      }
    },
  )

// Array of nice preset colors
const colorPaletteValues = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#FFA500',
  '#FFFF00',
  '#008000',
  '#0000FF',
  '#4B0082',
]

// -------------Page Component--------------------- \\
const UpdateAccountForm = ({
  profile,
  email,
}: {
  profile: ProfileRow
  email: string
}) => {
  const [isSubmitting, setIsSubmitting] = useState(true)
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState(email)
  const [currentUsername, setCurrentUsername] = useState(profile.username)
  const [currentColor, setCurrentColor] = useState(profile.color)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function getUserFromSession() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
        Router.push('/login')
      }
      const userId = data?.session?.user.id
      if (!userId || typeof userId === 'undefined') {
        Router.push('/login')
      }
      setUserId(userId as string)
      setIsSubmitting(false)
    }
    getUserFromSession()
  }, [])

  // Form
  // 1. Define your form.
  const defaultValues = {
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    color: '',
  }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onReset = () => {
    form.reset(defaultValues, {
      // Optionally, pass options to customize what aspects of the form state are reset
      keepErrors: false, // Choose true if you want to retain the errors
      keepDirty: false, // Choose true to keep the dirty state
      keepIsSubmitted: false, // Choose true to keep the isSubmitted state
      keepIsValid: false,
      keepValues: false,
      keepTouched: false,
      keepDirtyValues: false,
      keepIsSubmitSuccessful: false,
      keepDefaultValues: false,
      keepSubmitCount: false,
      // Add any other options you need
    })
    // For every key in the defaultValues object, set the value to undefined
  }

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    if (!values || isSubmitting || !userId) return
    // Check to see if all the values are undefined
    const allValuesUndefined = Object.values(values).every(
      (value) => value === undefined,
    )
    if (allValuesUndefined) return

    // Guard Checks done, start processing the data
    setIsSubmitting(true)

    // Create the form data for update
    const formData = new FormData()
    // Append each of the values
    for (const key of Object.keys(values) as (keyof typeof values)[]) {
      const value = values[key]
      if (value !== undefined && value !== null && value !== '') {
        // FormData.append can only take string | Blob, so ensure value is not an object
        formData.append(key, value as string)
      }
    }

    // Append the User's Id
    formData.append('userId', userId)

    // Update the local state
    const oldUsername = currentUsername
    const oldColor = currentColor
    const oldEmail = userEmail
    if (values.username) setCurrentUsername(values.username)
    if (values.email) setUserEmail(values.email)
    if (values.color) setCurrentColor(values.color)

    // Submit the form data
    const { data, error } = await updateUserDataSA(formData)
    if (error) {
      console.error(error)
      toast({
        title: 'Error Processing Update',
        variant: 'destructive',
        description: extractErrorMessage(error),
      })

      // Reset the local state
      setCurrentUsername(oldUsername)
      setCurrentColor(oldColor)
      setUserEmail(oldEmail)
      onReset()
      setIsSubmitting(false)
      return
    }

    // If we get here, the server action was successful
    // Show a toast notification to the user
    toast({
      title: 'Account Updated',
      description: 'Your account has been updated.',
      variant: 'default',
    })
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    // Create the form data for delete
    const formData = new FormData()
    formData.append('userId', userId)
    // Call the server action
    const { data, error } = await deleteUserAccount(formData)
    // Handle errors
    if (error) {
      console.error(error)
      toast({
        title: 'Error Processing Delete',
        variant: 'destructive',
        description: extractErrorMessage(error),
      })
      setIsSubmitting(false)
      return
    }

    // If we get here, the server action was successful
    // Sign the user out and redirect them to the homepage
    const supabase = createClientComponentClient()
    await supabase.auth.signOut()
    Router.push('/')
    setIsSubmitting(false)
  }

  // Take care of the color change
  const handleColorChange = (color: string) => {
    setCurrentColor(color)
    form.setValue('color', color)
    // Update the server
  }

  // User Account update form
  return (
    <Card className='mx-auto max-w-2xl'>
      <CardHeader className='items-center'>
        <CardTitle>Account</CardTitle>
        <CardDescription className='items-center flex flex-col'>
          <p className='text-center'>
            Change your account information here. <br />
            You do not need to fill in any information you don't want to update.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className=' space-y-3'>
        <div className='flex flex-col items-center mx-auto min-h-[200px] min-y-[200px] mb-4'>
          <Avatar className='h-fit w-fit'>
            <AvatarImage src='https://robohash.org/WOOO' />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <h1 className='text-center font-mono text-4xl mb-4 mt-2'>
            {currentUsername}
          </h1>
        </div>
        <h1> Update Your Information:</h1>
        <Form {...form}>
          <form
            autoComplete='off'
            aria-autocomplete='none'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8'
          >
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='New Username' {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p> Current Email: {userEmail}</p>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Email</FormLabel>
                  <FormControl>
                    <Input placeholder='New Email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show confirm email if email field is filled out */}
            {form.watch('email') && (
              <FormField
                control={form.control}
                name='confirmEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Email</FormLabel>
                    <FormControl>
                      <Input placeholder='Confirm Email' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='New Password'
                      type='password'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show confirm password if password field is filled out */}
            {form.watch('password') && (
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Confirm Password'
                        type='password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <SwatchesPicker
                      color={field.value || currentColor || '#000000'}
                      onChange={handleColorChange}
                      presetColors={colorPaletteValues}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <div className='flex flex-row space-x-4'>
              <Button type='submit' disabled={isSubmitting}>
                Submit
              </Button>
              <Button
                type='reset'
                variant='secondary'
                disabled={isSubmitting}
                onClick={onReset}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
        <CardFooter className='flex flex-col items-end'>
          {/* Delete Account Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                className='w-1/10 text-sm text-center opacity-20 hover:opacity-100'
              >
                <BsTrash3Fill className='w-full h-full' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Yourself?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? You'll continue existing in the real world, but
                  your account will be deleted along with all your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>🙅‍♀️ Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className='vibrating-element bg-red-500'
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </CardContent>
    </Card>
  )
}

export default UpdateAccountForm
