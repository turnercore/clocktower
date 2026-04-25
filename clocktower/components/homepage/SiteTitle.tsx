// SiteTitle.tsx
'use client'
import React, { createRef, useEffect, useMemo } from 'react'
import anime from 'animejs'
import { useAccessibility } from '@/providers/AccessibilityProvider'

const title = 'Clocktower'
const animatedLettersIndex = [8, 6, 2, 3]

const SiteTitle = () => {
  const rotationRefs = useMemo(
    () => title.split('').map(() => createRef<HTMLDivElement>()),
    [],
  )
  const { reduceMotion, screenReaderMode } = useAccessibility()

  useEffect(() => {
    if (reduceMotion || screenReaderMode) return

    const timeline = anime.timeline({
      loop: true,
      autoplay: true,
    })

    animatedLettersIndex.forEach((index) => {
      const ref = rotationRefs[index]
      let count = 0
      if (animatedLettersIndex.includes(index)) {
        timeline.add({
          targets: ref.current,
          rotate: '1turn',
          easing: function (el, i, total) {
            return function (t) {
              return t < 1 / 12 ? 0 : Math.floor(12 * t) / 12 // Custom easing function that starts with a delay
            }
          },
          duration: 60000 / 5,
          delay: count * (60000 / 5), // Delay the start of each animation
        })
        count++
      }
    })
  }, [reduceMotion, rotationRefs, screenReaderMode])

  return (
    <h1 className='mt-4 mb-3 text-center text-5xl font-extrabold leading-none tracking-tighter sm:text-7xl md:text-9xl'>
      {reduceMotion || screenReaderMode
        ? title
        : title.split('').map((letter, index) => (
            <div
              key={index}
              ref={rotationRefs[index]}
              className='inline-block pb-1 pr-1 sm:pr-2'
            >
              {letter}
            </div>
          ))}
    </h1>
  )
}

export default SiteTitle
