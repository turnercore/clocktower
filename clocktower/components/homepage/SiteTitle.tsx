// SiteTitle.tsx
'use client'
import React, { useRef, useEffect } from 'react'
import anime from 'animejs'

const title = 'Clocktower'
const animatedLettersIndex = [8, 6, 2, 3]

const SiteTitle = () => {
  const rotationRefs = title.split('').map(() => useRef<HTMLDivElement>(null))

  useEffect(() => {
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
          duration: 60000 / 3,
          delay: count * (60000 / 3), // Delay the start of each animation
        })
        count++
      }
    })
  }, [])

  return (
    <h1 className='text-[11rem] mt-4 mb-2 tracking-tighter leading-tight font-extrabold text-center'>
      {title.split('').map((letter, index) => (
        <div
          key={index}
          ref={rotationRefs[index]}
          className='inline-block pr-2 pb-7'
        >
          {letter}
        </div>
      ))}
    </h1>
  )
}

export default SiteTitle
