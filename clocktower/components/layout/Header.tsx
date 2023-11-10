import UserAvatar from '../user/UserAvatar'
import {
  Button,
  ModeToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import { TowersDropdown } from './TowersDropdown'
import ShareTowerPopover from './ShareTowerPopover'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import HeaderTriangleDecoration from './HeaderTriangleDecoration'
import LoginForm from '../forms/LoginForm'

export default async function Header() {
  // See if user is logged in
  // If not, show login button
  // If so, show user avatar
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase.auth.getSession()
  const isUserLoggedIn = !error && data?.session?.user ? true : false

  return (
    <header className='relative bg-[#A6D3C9] dark:bg-opacity-20 bg-opacity-50 top-0 w-full flex justify-between items-center p-4'>
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />
      <div className='flex flex-1 justify-center items-center'>
        {isUserLoggedIn ? (
          <div className='flex flex-row space-x-2 ml-18'>
            <TowersDropdown />
            {/* <ShareTowerPopover /> */}
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
      {isUserLoggedIn && <UserAvatar />}
      <HeaderTriangleDecoration />
    </header>
  )
}
