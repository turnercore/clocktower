import Link from 'next/link'
import PublicClock from '@/components/homepage/PublicClock'

const Home: React.FC = () => {
  return (
    <div className='flex flex-col text-center items-center'>
      <h1 className='text-9xl mt-6 mb-4 tracking-tighter leading-tight font-extrabold'>
        Clocktower
      </h1>
      <p className='text-2xl mb-2'>Realtime sharable game clocks.</p>
      <Link href='/login'> Login to get started.</Link>
      <div className='h-[250px] w-[250px] items-center flex-col'>
        <PublicClock />
      </div>
    </div>
  )
}

export default Home
