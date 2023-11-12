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
import {
  User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs'
import HeaderTriangleDecoration from './HeaderTriangleDecoration'
import LoginForm from '../forms/LoginForm'
import Link from 'next/link'
import { GoHome } from 'react-icons/go'
import { Database } from '@/types/supabase'
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
      <Button variant='outline' size='icon' asChild>
        <Link href='/'>
          <GoHome className='h-[1.2rem] w-[1.2rem]' />
        </Link>
      </Button>
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />

      <div className='flex flex-1 justify-center items-center'>
        {isUserLoggedIn ? (
          <div className='flex flex-row space-x-2 ml-18'>
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
              <Button variant='link' className=' mr-10 z-100 text-lg'>
                Login
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <LoginForm />
            </PopoverContent>
          </Popover>
        )}
      </div>
      {isUserLoggedIn && (
        <>
          <InvitedUsersList isInteractable={false} />
          <UserAvatar />
        </>
      )}
      <HeaderTriangleDecoration />
    </div>
  )
}
