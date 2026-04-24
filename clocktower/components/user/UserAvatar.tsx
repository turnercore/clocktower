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
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { type Profile, ProfileSchema } from '@/types/schemas'
import { GoGear, GoSignOut } from 'react-icons/go'
import { Menu } from 'lucide-react'
import hash from '@/tools/hash'
import fetchSupabaseProfileSA from '@/tools/actions/fetchSupabaseProfileSA'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { useRouter } from 'next/navigation'

interface UserAvatarProps {
  className?: string
  user?: User | null
}

const UserAvatar = ({ className, user }: UserAvatarProps) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()


  //Get user on mount
  useEffect(() => {
    const getSupabaseUser = async () => {
      if (!user) return
      try {
        // Now get the profile
        const { data: profileData, error: profileError } = await fetchSupabaseProfileSA(user.id)
        
        // Validate output of fetchSupabaseProfileSA
        const validatedProfileData = ProfileSchema.parse(profileData)
        
        setProfile(validatedProfileData)

        setIsLoading(false)
      } catch (error) {
        console.error(extractErrorMessage(error, 'Error getting user'))
      }
    }

    getSupabaseUser()
  }, [user])

  const signOut = () => {
    router.push('/account/logout')
    setProfile(null)
  }

  if (!user || !profile) return <></>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`group relative h-[45px] w-[45px] rounded-full drop-shadow-md transition-transform duration-150 hover:scale-110 hover:drop-shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
          aria-label='Open user menu'
          type='button'
        >
          <Avatar
            className='h-full w-full'
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
          <span className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100'>
            <Menu className='h-5 w-5 text-white/85' aria-hidden='true' />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel className='text-center'>
          {profile.username}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/account/profile'>
              <GoGear className='mr-2 h-4 w-4' />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onSelect={signOut}>
            <GoSignOut className='mr-2 h-4 w-4' />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserAvatar
