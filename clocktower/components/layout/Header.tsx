import UserAvatar from '../user/UserAvatar'
import { Button, ModeToggle } from '@/components/ui'
import { TowersDropdown } from './TowersDropdown'
import ShareTowerPopover from '../../app/tower/[id]/components/ShareTowerPopover'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import HeaderTriangleDecoration from './HeaderTriangleDecoration'

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
            <ShareTowerPopover />
          </div>
        ) : (
          <Link href='/login' className=' mr-10 z-100'>
            <Button variant='link' className='text-lg'>
              Login
            </Button>
          </Link>
        )}
      </div>
      {isUserLoggedIn && <UserAvatar className='flex justify-end flex-1' />}
      <HeaderTriangleDecoration />
    </header>
  )
}
