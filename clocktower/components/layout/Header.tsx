'use client'
import UserAvatar from '../user/UserAvatar'
import {
  Button,
  ModeToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import TowersDropdown from './TowersDropdown'
import ShareTowerPopover from './ShareTowerPopover'
import { User } from '@supabase/auth-helpers-nextjs'
import HeaderTriangleDecoration from './HeaderTriangleDecoration'
import LoginForm from '../forms/LoginForm'
import Link from 'next/link'
import { GoHome } from 'react-icons/go'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import InvitedUsersList from './InvitedUsersList'

// Changing this to a client componenet
export default function Header({ user }: { user: User | null }) {
  // See if user is logged in
  // If not, show login button
  // If so, show user avatar
  const path = usePathname()
  const params = useParams()
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(user ? true : false)

  return (
    <div className='relative bg-[#A6D3C9] dark:bg-opacity-20 bg-opacity-50 top-0 w-full flex justify-between items-center p-4 space-x-2'>
      {/* Left side of header */}
      <div>
        <Button variant='outline' size='icon' asChild>
          <Link href='/'>
            <GoHome className='h-[1.2rem] w-[1.2rem]' />
          </Link>
        </Button>
        <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />
      </div>
      {/* Center of Header */}
      <div>
        <HeaderTriangleDecoration />

        {isUserLoggedIn ? (
          <div className='flex flex-row space-x-2 pr-6'>
            <TowersDropdown user={user} />
            {
              // If on tower page, show share tower button
              path.includes('tower') && params.id && (
                <>
                  <ShareTowerPopover />
                </>
              )
            }
          </div>
        ) : (
          <Popover>
            <PopoverTrigger>
              <Button variant='link' className=' text-center z-100 text-lg'>
                Login
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <LoginForm />
            </PopoverContent>
          </Popover>
        )}
      </div>
      {/* Right side of header */}
      <div className='flex flex-row'>
        {isUserLoggedIn && (
          <>
            <InvitedUsersList isInteractable={false} />
            <UserAvatar />
          </>
        )}
      </div>
    </div>
  )
}
