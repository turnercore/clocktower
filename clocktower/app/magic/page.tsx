'use client'
import React, { useEffect, useRef } from 'react'
import anime from 'animejs'

const MagicPage = () => {
  const wandRef = useRef(null)
  const headingRef = useRef(null)
  const paragraph1Ref = useRef(null)
  const paragraph2Ref = useRef(null)
  const hintRef = useRef(null)

  useEffect(() => {
    // Initial scaling and fading animation
    anime
      .timeline({ loop: false })
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
        targets: headingRef.current,
        scale: [0, 1], // Scale up the text
        duration: 1000,
        easing: 'easeInOutSine',
        delay: 500,
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

    // Looping color change animation
    anime({
      targets: headingRef.current,
      color: [
        { value: '#ff4ecd' }, // Pink
        { value: '#4ecbff' }, // Light blue
        { value: '#4eff5e' }, // Green
        { value: '#ffea4e' }, // Yellow
        { value: '#f44242' }, // Red
        { value: '#8a2be2' }, // Blue violet
        { value: '#20b2aa' }, // Light sea green
        { value: '#ff1493' }, // Deep pink
        { value: '#ff4ecd' }, // Back to Pink to loop smoothly
      ],
      duration: 10000, // Adjust the duration for a smoother transition
      loop: true,
      easing: 'linear', // Use linear easing for consistent speed
    })
  }, [])

  return (
    <div className='flex flex-col items-center mt-16'>
      <div className='flex flex-row items-center'>
        <p ref={wandRef} className='text-7xl font-bold mb-4 ml-8'>
          🪄
        </p>
        <h1 ref={headingRef} className='text-8xl font-bold mb-4'>
          Magic
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
