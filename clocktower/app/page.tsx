import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'
import { Button } from '@/components/ui'
import { Suspense } from 'react'
import SiteTitle from '@/components/homepage/SiteTitle'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import CreateNewTowerButton from '@/components/homepage/CreateNewTowerButton'
import LoginSuccessToast from '@/components/homepage/LoginSuccessToast'

const Home = async () => {
  let isLoggedIn = false
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (data?.user && !error) {
      isLoggedIn = true
    }
  }

  return (
    <div className='relative flex flex-col text-center items-center mb-[100px]'>
      <LoginSuccessToast />
      <SiteTitle />
      <div className='mb-8 flex flex-col items-center gap-5'>
        <p className='text-2xl leading-tight'>
          Shared game clocks for tabletop RPGs
        </p>
        {isLoggedIn ? (
          <div className='flex flex-col items-center gap-4'>
            <p>To make some clocks, select a tower from the dropdown above.</p>
            <CreateNewTowerButton />
          </div>
        ) : (
          <div className='flex flex-row space-x-3 items-center mx-auto'>
            <Button variant='outline' asChild>
              <Link href='/account/login'>Login</Link>
            </Button>
            <p>to make some clocks</p>
          </div>
        )}
      </div>

      <div className='flex w-[min(320px,80vw)] items-center flex-col'>
        <Suspense fallback={<p>🕘</p>}>
          <PublicClock />
        </Suspense>
      </div>
    </div>
  )
}

export default Home
