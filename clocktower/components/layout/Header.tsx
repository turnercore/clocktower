import UserAvatar from '../user/UserAvatar'
import { Button, ModeToggle } from '@/components/ui'
import { TowersDropdown } from './TowersDropdown'
import ShareTowerPopover from '../../app/tower/[id]/components/ShareTowerPopover'
import { Suspense } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Header() {
  // See if user is logged in
  // If not, show login button
  // If so, show user avatar
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.auth.getSession()
  const isUserLoggedIn = !error && data?.session?.user ? true : false
  console.log('isUserLoggedIn', isUserLoggedIn)
  return (
    <header className='bg-[#A6D3C9] dark:bg-opacity-20 bg-opacity-50 top-0 w-full h-[50px] flex justify-between items-center p-4'>
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />
      <div className='flex flex-row items-center'>
        <div className='flex items-center mx-auto mr-5'>
          {isUserLoggedIn && (
            <div className='flex flex-row space-x-2'>
              <TowersDropdown />
              <ShareTowerPopover />
            </div>
          )}
          {!isUserLoggedIn && (
            <Link href='/login'>
              <Button variant='link' className='text-lg'>
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className='flex mt-1 mb-1'>{isUserLoggedIn && <UserAvatar />}</div>
    </header>
  )
}
