import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'
import { Button } from '@/components/ui'
import { Suspense } from 'react'
import SiteTitle from '@/components/homepage/SiteTitle'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const Home = async () => {
  let isLoggedIn = false
  const supabase = createServerComponentClient({ cookies })
  const { data, error } = await supabase.auth.getSession()
  if (data?.session?.user && !error) {
    isLoggedIn = true
  }

  return (
    <div className='relative flex flex-col text-center items-center mb-[100px]'>
      <SiteTitle />
      <div className=' mb-8 flex flex-col items-center space-y-4'>
        <p className='text-2xl mb-2'>Shared game clocks for tabletop RPGs</p>
        {isLoggedIn ? (
          <>
            <p>To make some clocks, select a tower from the dropdown above.</p>
            <Button variant='outline'>Or create a new tower!</Button>
          </>
        ) : (
          <div className='flex flex-row space-x-3 items-center mx-auto'>
            <Button variant='outline' asChild>
              <Link href='/account/login'>Login</Link>
            </Button>
            <p>to make some clocks</p>
          </div>
        )}
      </div>

      <div className='max-h-[500px] w-[500px] flex items-center flex-col'>
        <Suspense fallback={<p>🕘</p>}>
          <PublicClock />
        </Suspense>
      </div>
    </div>
  )
}

export default Home
