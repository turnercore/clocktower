import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { GeistSans, GeistMono } from 'geist/font'
import { Providers } from '@/app/providers'

const url = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Clocktower',
  viewport: 'width=device-width, initial-scale=1',
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
  return (
    <html lang='en'>
      <head>
        <link rel='stylesheet' href='https://use.typekit.net/ckd1nmz.css' />
      </head>
      <body className={`${GeistSans.className} min-w-full`}>
        <Providers>
          <div className='flex flex-col  w-full min-h-screen min-w-screen bg-main-background-layered-waves-svg bg-cover dark:bg-main-background-layered-waves-dark-svg'>
            <Header />
            <main className='w-full flex-1 mt-3'>{children}</main>
            <Toaster />
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
