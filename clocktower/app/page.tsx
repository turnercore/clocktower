import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'
import { Button } from '@/components/ui'
import { Suspense } from 'react'

const Home: React.FC = () => {
  return (
    <div className='relative flex flex-col text-center items-center min-h-screen'>
      <h1 className='text-9xl mt-3 mb-2 tracking-tighter leading-tight font-extrabold'>
        Clocktower
      </h1>
      <p className='text-2xl mb-4'>Shared game clocks for tabletop RPGs</p>
      <Link href='/login'>
        {' '}
        <Button variant='outline'> Login </Button> to make some clocks{' '}
      </Link>
      <div className='max-h-[500px] w-[500px] flex items-center flex-col mt-10'>
        <Suspense fallback={<p>🕘</p>}>
          <PublicClock />
        </Suspense>
      </div>
    </div>
  )
}

export default Home
