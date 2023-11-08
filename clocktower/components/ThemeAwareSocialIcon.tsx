'use client'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeAwareSocialIconProps {
  iconDark?: string
  iconLight?: string
  alt?: string
  width?: number
  height?: number
  className?: string
}

// Defaults to:
const defaultAlt = 'Social Icon'
const defaultWidth = 98
const defaultHeight = 96
const defaultclassName = 'h-6 w-6 ml-2'

const ThemeAwareSocialIcon = ({
  iconDark = '',
  iconLight = '',
  alt = defaultAlt,
  width = defaultWidth,
  height = defaultHeight,
  className = defaultclassName,
}) => {
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  // If they only gave us one icon then we'll just use it for both
  if (!iconDark && !iconLight) {
    return null
  }
  if (!iconDark) {
    iconDark = iconLight
  }
  if (!iconLight) {
    iconLight = iconDark
  }

  useEffect(() => {
    // Set the theme in useEffect to avoid hydration issues
    setIsDark(theme == 'dark')
  }, [theme])

  return (
    <Image
      src={isDark ? iconDark : iconLight}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  )
}

export default ThemeAwareSocialIcon
