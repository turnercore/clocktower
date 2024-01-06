'use client'
import Confetti from 'react-confetti'
import Link from 'next/link'
import useWindowSize from '@/hooks/useWindowSize'
import { Button } from '@/components/ui'
import anime from 'animejs'
import { useEffect, useRef } from 'react'
import { useAccessibility } from '@/providers/AccessibilityProvider'

const WelcomePage = () => {
  const { width, height } = useWindowSize()
  const welcomeRef = useRef(null)
  const { reduceMotion } = useAccessibility()

  useEffect(() => {
    anime.timeline({ loop: false }).add({
      targets: welcomeRef.current,
      opacity: [0, 1],
      translateY: [-50, 0],
      easing: 'easeOutExpo',
      duration: 1200,
    })
  }, [])

  if (reduceMotion) {
    return (
      <div className='flex flex-col items-center justify-center h-screen p-4 pb-80'>
        <div ref={welcomeRef} className='text-center items-center'>
          <h1 className='text-9xl font-bold'>Welcome!</h1>
          <p className='mt-2 mb-10 text-xl'>
            Now you're ready to get started, just login with your shiny new
            account.
          </p>
          <Button className='w-32 h-16 text-2xl transition-colors' asChild>
            <Link href='/account/login'>Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen p-4 pb-80'>
      <div ref={welcomeRef} className='text-center items-center'>
        <h1 className='text-9xl font-bold'>Welcome!</h1>
        <p className='mt-2 mb-10 text-xl'>
          Now you're ready to get started, just login with your shiny new
          account.
        </p>
        <Button className='w-32 h-16 text-2xl transition-colors' asChild>
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
