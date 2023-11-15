'use client'
import Confetti from 'react-confetti'
import Link from 'next/link'
import useWindowSize from '@/hooks/useWindowSize'
import { Button } from '@/components/ui'

const WelcomePage = () => {
  const { width, height } = useWindowSize()
  //TODO Add an animation to welcome after the confetti

  return (
    <div className='flex flex-col items-center space-y-2'>
      <div className='text-center items-center'>
        <h1 className='text-9xl'>Welcome!</h1>
        <p className='mt-2 mb-10'>
          Now you're ready to get started, just login with your shiny new
          account.
        </p>
      </div>
      <div className='mt-10'>
        <Button className='w-32 h-16 text-2xl' asChild>
          <Link href='/account/login'>Login</Link>
        </Button>
      </div>

      <Confetti
        width={width}
        height={height}
        recycle={false}
        wind={0.01}
        numberOfPieces={400}
      />
    </div>
  )
}

export default WelcomePage
