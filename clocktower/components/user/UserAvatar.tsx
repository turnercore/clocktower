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
  type User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { type Profile, ProfileSchema } from '@/types/schemas'
import { GoGear, GoSignOut } from 'react-icons/go'
import hash from '@/tools/hash'
import fetchSupabaseProfileSA from '@/tools/actions/fetchSupabaseProfileSA'

interface UserAvatarProps {
  className?: string
}

const UserAvatar = ({ className }: UserAvatarProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
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
        const { data: profileData, error: profileError } = await fetchSupabaseProfileSA(data.session.user.id)
        
        // Validate output of fetchSupabaseProfileSA
        const validatedProfileData = ProfileSchema.parse(profileData)
        
        setProfile(validatedProfileData)

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
          className={`h-[45px] w-[45px] hover:scale-110 drop-shadow-md hover:drop-shadow-xl ${className}`}
          style={{ backgroundColor: profile.color || '#FFFFFF' }}
        >
          <AvatarImage
            style={{ backgroundColor: profile.color || '#FFFFFF' }}
            src={`https://robohash.org/${hash(
              profile.username || 'clocktower',
            )}?set=set${profile.avatar_set}&size=64x64`}
          />
          <AvatarFallback>CT</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel className='text-center'>
          {profile.username}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <Link href='/account/profile'>
            <DropdownMenuItem>
              <GoGear className='mr-2 h-4 w-4' />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>

          <Link href='/account/logout'>
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

export default UserAvatar
