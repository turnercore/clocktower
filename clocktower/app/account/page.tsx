'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui'
import { HexColorPicker } from 'react-colorful'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const formSchema = z.object({
  username: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  fullName: z.string(),
  email: z.string().email(),
})

const IconPickerDialog: React.FC<{
  onConfirm: (icon: string, bgColor: string, iconColor: string) => void
}> = ({ onConfirm }) => {
  // ... (No changes here)
}

const Account: React.FC = () => {
  const supabase = createClientComponentClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  })

  const handleIconUpdate = (
    newIcon: string,
    newBgColor: string,
    newIconColor: string,
  ) => {
    // ...
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Update user data on the server
    // ...
  }

  return (
    <div className='account-page'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        <div className='user-info'>
          <label>Username: </label>
          <input {...register('username')} type='text' />
          {errors.username && <span>{errors.username.message}</span>}

          <label>Email: </label>
          <input {...register('email')} type='email' disabled />

          <label>Full Name: </label>
          <input {...register('fullName')} type='text' />
        </div>
        <IconPickerDialog onConfirm={handleIconUpdate} />
        {/* Display the selected icon with the chosen colors */}
        {/* ... (No changes here) */}
        <Button type='submit'>Update</Button>
      </form>
    </div>
  )
}

export default Account
