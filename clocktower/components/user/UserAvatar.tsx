'use client'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui'
import {
  User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Profile } from '@/types/schemas'
import { Settings } from 'lucide-react'
import { GoGear, GoSignOut } from 'react-icons/go'
import hash from '@/tools/hash'

export default function UserAvatar({ className = '' }) {
  // ... existing state and useEffect hooks
  const [isHovered, setIsHovered] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  //Get user on mount
  useEffect(() => {
    const getSupabaseUser = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!data.session?.user)
          throw new Error('No user found in session data')
        setUser(data.session.user)

        // Now get the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (profileError) throw profileError
        if (!profileData) throw new Error('No profile data found')
        setProfile(profileData)

        setIsLoading(false)
      } catch (error: any) {
        console.error(error.message)
      }
    }

    getSupabaseUser()
  }, [])

  if (!user || !profile) return <></>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar
          className='h-[45px] w-[45px] hover:scale-110 drop-shadow-md hover:drop-shadow-xl'
          style={{ backgroundColor: profile.color || '#FFFFFF' }}
        >
          <AvatarImage
            src={`https://robohash.org/${hash(
              profile.username || 'clocktower',
            )}`}
          />
          <AvatarFallback>CT</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel className='text-center'>
          {profile.username}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <Link href='/account'>
            <DropdownMenuItem>
              <GoGear className='mr-2 h-4 w-4' />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>

          <Link href='/signout'>
            <DropdownMenuItem>
              <GoSignOut className='mr-2 h-4 w-4' />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
