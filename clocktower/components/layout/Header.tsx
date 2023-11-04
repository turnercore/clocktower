import UserAvatar from '../user/UserAvatar'
import { ModeToggle } from '@/components/ui'
import { TowersDropdown } from './TowersDropdown'
import ShareTowerPopover from '../../app/tower/[id]/components/ShareTowerPopover'
import { Suspense } from 'react'

export default async function Header() {
  return (
    <header className='bg-gray-500 bg-opacity-10 top-0 w-full h-[62px] flex justify-between items-center p-4'>
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner' />
      <div className='flex flex-row items-center'>
        <div className='flex items-center mx-auto ml-5'>
          <Suspense fallback={<div>Loading...</div>}>
            <TowersDropdown />
          </Suspense>
        </div>
        <ShareTowerPopover />
      </div>
      <div className='flex mt-1 mb-1'>
        <UserAvatar />
      </div>
    </header>
  )
}
