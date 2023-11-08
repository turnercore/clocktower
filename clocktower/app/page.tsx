import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'
import { Button } from '@/components/ui'
import { Suspense } from 'react'

const Home: React.FC = () => {
  return (
    <div className='relative flex flex-col text-center items-center'>
      <h1 className=' text-[11rem] mt-4 mb-2 tracking-tighter leading-tight font-extrabold'>
        Clocktower
      </h1>
      <div className=' mb-16'>
        <p className='text-2xl mb-2'>Shared game clocks for tabletop RPGs</p>
        <Link href='/login'>
          <Button variant='outline'> Login </Button>
        </Link>
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
