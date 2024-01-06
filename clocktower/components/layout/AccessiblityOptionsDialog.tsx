'use client'
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { RxAccessibility } from 'react-icons/rx'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  ModeToggle,
  Switch,
  Toggle,
} from '../ui'
import { DialogClose, DialogTrigger } from '@radix-ui/react-dialog'
import { useAccessibility } from '@/providers/AccessibilityProvider'

export function AccessibilityOptionsDialog({
  className,
}: {
  className?: string
}) {
  const {
    reduceMotion,
    toggleReduceMotion,
    screenReaderMode,
    toggleScreenReaderMode,
  } = useAccessibility()

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
        <RxAccessibility className='h-[1.2rem] w-[1.2rem]' />
        <span className='sr-only'>Accessiblity Options</span>
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger aria-label='Open Accessiblity Settings' asChild>
        <Button variant='outline' size='icon' className={className}>
          <RxAccessibility className='h-[1.2rem] w-[1.2rem]' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className='space-y-2'>
          <DialogTitle>Accessibility Settings</DialogTitle>
          <DialogDescription>
            Change the theme and other accessibility options.
          </DialogDescription>
        </DialogHeader>
        <div className='flex items-center space-x-2'>
          <Switch
            id='screen-reader-mode'
            checked={screenReaderMode}
            onCheckedChange={toggleScreenReaderMode}
          />
          <Label htmlFor='screen-reader-mode'>Screen Reader Mode Toggle</Label>
        </div>

        <div className='flex flex-col space-y-4 mt-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='reduced-motion-mode'
              checked={reduceMotion}
              onCheckedChange={toggleReduceMotion}
            />
            <Label htmlFor='reduced-motion-mode'>Reduced Motion Toggle</Label>
          </div>

          <div className='flex flex-row space-x-4 items-center'>
            <Label htmlFor='theme-toggle'>Theme: </Label>
            <ModeToggle />
          </div>
        </div>
        <DialogClose aria-label='Close Accessiblity Settings' />
      </DialogContent>
    </Dialog>
  )
}
