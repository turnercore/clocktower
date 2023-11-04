import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { GeistSans, GeistMono } from 'geist/font'
import { Suspense } from 'react'
export const dynamic = 'force-dynamic'

const url = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Clocktower',
  description: 'Sharable clocks for TTRPG games.',
  applicationName: 'Clocktower',
  authors: [{ name: 'Turner Monroe', url: 'https://github.com/turnercore' }],
  creator: 'Turner Monroe',
  keywords: [
    'bitd',
    'blades in the dark',
    'fabula ultima',
    'ttrpg',
    'tabletop',
    'rpg',
    'tabletop tools',
    'tool',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDark = false

  return (
    <html lang='en'>
      <head>
        <link rel='stylesheet' href='https://use.typekit.net/ckd1nmz.css' />
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <div className='flex flex-col min-h-screen'>
            {/* <Header /> */}
            <div className='flex-1 mt-3 mb-3'>{children}</div>
            <div className='background'></div>
            <Toaster />
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
