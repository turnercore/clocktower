'use client'
import * as React from 'react'
import { GiMoonBats } from 'react-icons/gi'
import { useTheme } from 'next-themes'
import { Button } from './button'
import { TbSunHigh, TbSunset2 } from 'react-icons/tb'
import { useEffect, useState } from 'react'

export function ModeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  // Function to toggle theme between light and dark
  const toggleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  if (!mounted) {
    return (
      <Button variant='outline' size='icon' className={className}>
        <TbSunset2 className='h-[1.2rem] w-[1.2rem]' />
        <span className='sr-only'>Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant='outline'
      size='icon'
      className={className}
      onClick={toggleTheme}
    >
      {/* Show Sun icon if theme is light, otherwise show Moon icon */}
      {resolvedTheme !== 'dark' ? (
        <TbSunHigh className='h-[1.2rem] w-[1.2rem]' />
      ) : (
        <GiMoonBats className='h-[1.2rem] w-[1.2rem]' />
      )}
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
