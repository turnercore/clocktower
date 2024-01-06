// app/providers.jsx
'use client'
import { ThemeProvider } from 'next-themes'
import { AccessibilityProvider } from './AccessibilityProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme='dark' enableSystem attribute='class'>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </ThemeProvider>
  )
}
