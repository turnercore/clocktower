import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'
import { Button } from '@/components/ui'
import { Suspense } from 'react'
import SiteTitle from '@/components/homepage/SiteTitle'

const Home = () => {
  return (
    <div className='relative flex flex-col text-center items-center mb-[100px]'>
      <SiteTitle />
      <div className=' mb-8'>
        <p className='text-2xl mb-2'>Shared game clocks for tabletop RPGs</p>
        <div>
          <Button variant='outline' asChild>
            <Link href='/account/login'>Login</Link>
          </Button>
        </div>
        to make some clocks
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
