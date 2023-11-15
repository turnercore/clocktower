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
import HeaderTriangleDecoration from './HeaderTriangleDecoration'
import LoginForm from '../forms/LoginForm'
import Link from 'next/link'
import { GoHome } from 'react-icons/go'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import InvitedUsersList from './InvitedUsersList'
import {
  type User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs'

// Changing this to a client componenet
export default function Header() {
  const path = usePathname()
  const params = useParams()
  const supabase = createClientComponentClient()
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const [towerId, setTowerId] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUserFromSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session?.user && !error) {
        setUser(data.session.user)
      }
    }

    setIsOnTowerPage(path.includes('tower') && params.id ? true : false)
    setTowerId((params.id as string) || '')
    getUserFromSession()
    setIsLoading(false)
  }, [supabase, path, params])

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

        {user ? (
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
          <>
            {!isLoading && (
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
          </>
        )}
      </div>
      {/* Right side of header */}
      <div className='flex-1 flex justify-end'>
        {user && (
          <div className='flex flex-row space-x-2'>
            {isOnTowerPage && <InvitedUsersList isInteractable={false} />}
            <UserAvatar />
          </div>
        )}
      </div>
    </div>
  )
}
