'use client'
import React, { useEffect, useRef } from 'react'
import anime from 'animejs'
import { useAccessibility } from '@/providers/AccessibilityProvider'

const MagicPage = () => {
  const { reduceMotion, screenReaderMode } = useAccessibility()
  const headingRef = useRef(null)
  const wandRef = useRef(null)
  const mRef = useRef(null)
  const aRef = useRef(null)
  const gRef = useRef(null)
  const iRef = useRef(null)
  const cRef = useRef(null)
  const paragraph1Ref = useRef(null)
  const paragraph2Ref = useRef(null)
  const hintRef = useRef(null)

  useEffect(() => {
    // Initial scaling and fading animation
    anime
      .timeline({ loop: false })
      .add({
        targets: headingRef.current,
        scale: [0, 1], // Scale up the text
        duration: 1000,
        easing: 'easeInOutSine',
        delay: 500,
      })
      .add({
        targets: wandRef.current,
        // Wand should start roated 45 degrees counter-clockwise
        rotate: ['-45deg', '35deg'],
        duration: 200,
        easing: 'easeInSine',
      })
      .add({
        targets: wandRef.current,
        // Wand should rotate back to 0 degrees
        rotate: ['35deg', '0deg'],
        duration: 200,
        easing: 'easeOutSine',
      })
      .add({
        targets: paragraph1Ref.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeInOutSine',
      })
      .add({
        targets: hintRef.current,
        opacity: [0, 1],
        translateX: [0, 40],
        duration: 400,
        easing: 'easeInOutSine',
      })
      .add({
        targets: paragraph2Ref.current,
        opacity: [0, 1],
        translateX: [0, 45],
        duration: 600,
        easing: 'easeInOutSine',
      })

    const letters = [mRef, aRef, gRef, iRef, cRef]
    letters.forEach((letter, index) => {
      anime({
        targets: letter.current,
        color: [
          { value: '#ff4ecd' }, // Pink
          { value: '#ff7ae5' }, // Lighter Pink
          { value: '#ff9ecd' }, // Even Lighter Pink
          { value: '#ffb8d1' }, // Near Peach
          { value: '#ffd3d8' }, // Pale Pink
          { value: '#ffe9e1' }, // Almost White
          // Pale Yellow
          { value: '#fff9c4' },
          // Yellow
          { value: '#fff59d' },
          // Yellow Orange
          { value: '#fff176' },
          // Orange
          { value: '#ffee58' },
          // Light Orange
          { value: '#ffeb3b' },
          // Pale Orange
          { value: '#fff9c4' },
          // Now reverse back to pink
          { value: '#ffe9e1' },
          { value: '#ffd3d8' },
          { value: '#ffb8d1' },
          { value: '#ff9ecd' },
          { value: '#ff7ae5' },
          { value: '#ff4ecd' }, // Back to Pink to loop smoothly
        ],
        duration: 7000, // Longer duration for smoother transition
        loop: true,
        easing: 'linear',
        delay: 1750 + index * 200, // Adjusted stagger delay
      })
    })
  }, [])

  if (reduceMotion || screenReaderMode) {
    return (
      <div className='flex flex-col items-center mt-16'>
        <div className='flex flex-row items-center'>
          <p ref={wandRef} className='text-7xl font-bold mb-4 ml-8'>
            🪄
          </p>
          <h1
            ref={headingRef}
            className='text-8xl font-bold mb-4 dark:text-black text-white'
          >
            <span ref={mRef}>M</span>
            <span ref={aRef}>a</span>
            <span ref={gRef}>g</span>
            <span ref={iRef}>i</span>
            <span ref={cRef}>c</span>
          </h1>
        </div>

        <div className=' pl-28 mt-2'>
          <p ref={paragraph1Ref} className='text-xl'>
            What's going to happen next?
          </p>
          <div className='flex flex-row items-center'>
            <p ref={hintRef} className='text-lg italic'>
              Hint:{' '}
            </p>
            <p ref={paragraph2Ref} className='text-lg italic'>
              Check your email.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center mt-16'>
      <div className='flex flex-row items-center'>
        <p ref={wandRef} className='text-7xl font-bold mb-4 ml-8'>
          🪄
        </p>
        <h1
          ref={headingRef}
          className='text-8xl font-bold mb-4 dark:text-black text-white'
        >
          <span ref={mRef}>M</span>
          <span ref={aRef}>a</span>
          <span ref={gRef}>g</span>
          <span ref={iRef}>i</span>
          <span ref={cRef}>c</span>
        </h1>
      </div>

      <div className=' pl-28 mt-2'>
        <p ref={paragraph1Ref} className='text-xl'>
          What's going to happen next?
        </p>
        <div className='flex flex-row items-center'>
          <p ref={hintRef} className='text-lg italic'>
            Hint:{' '}
          </p>
          <p ref={paragraph2Ref} className='text-lg italic'>
            Check your email.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MagicPage
