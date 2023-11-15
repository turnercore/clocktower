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
import { is } from 'date-fns/locale'

// Changing this to a client componenet
export default function Header({ user }: { user: User | null }) {
  const path = usePathname()
  const params = useParams()
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const [towerId, setTowerId] = useState('')
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)

  useEffect(() => {
    setIsUserLoggedIn(user ? true : false)
    setIsOnTowerPage(path.includes('tower') && params.id ? true : false)
    setTowerId((params.id as string) || '')
  }, [user, path, params])

  return (
    <div className='relative bg-[#A6D3C9] dark:bg-opacity-20 bg-opacity-50 top-0 w-full flex justify-between items-center p-4 space-x-2'>
      {/* Left side of header */}
      <div className='flex-1 flex justify-start'>
        <Button variant='outline' size='icon' asChild>
          <Link href='/'>
            <GoHome className='h-[1.2rem] w-[1.2rem]' />
          </Link>
        </Button>
        <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />
      </div>
      {/* Center of Header */}
      <div className='flex-0 min-w-0'>
        <HeaderTriangleDecoration />

        {isUserLoggedIn ? (
          <div className='flex flex-row space-x-2 pr-6'>
            <TowersDropdown user={user} />
            {
              // If on tower page, show share tower button
              isOnTowerPage && (
                <>
                  <ShareTowerPopover />
                </>
              )
            }
          </div>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='link' className='text-lg text-center'>
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
      <div className='flex-1 flex justify-end'>
        {isUserLoggedIn && (
          <div className='flex flex-row space-x-2'>
            {isOnTowerPage && <InvitedUsersList isInteractable={false} />}
            <UserAvatar />
          </div>
        )}
      </div>
    </div>
  )
}
