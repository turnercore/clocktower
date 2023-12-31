import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Metadata, Viewport } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { GeistSans } from 'geist/font'
import { Providers } from '@/providers/providers'
import { Suspense } from 'react'

const url = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
}

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <head>
        <link rel='stylesheet' href='https://use.typekit.net/ckd1nmz.css' />
      </head>
      <body className={`${GeistSans.className} min-w-full`}>
        <Providers>
          <div className='flex flex-col  w-full min-h-screen min-w-screen bg-main-background-layered-waves-svg bg-cover dark:bg-main-background-layered-waves-dark-svg'>
            <Suspense
              fallback={
                <div className='relative bg-[#A6D3C9] dark:bg-opacity-20 bg-opacity-50 top-0 w-full flex justify-between items-center p-4 space-x-2'></div>
              }
            >
              <Header />
            </Suspense>
            <Suspense>
              <main className='w-full flex-1 mt-3'>{children}</main>
            </Suspense>
            <Toaster />
          </div>
          <Suspense>
            <Footer />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
