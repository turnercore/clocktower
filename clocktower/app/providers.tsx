// 'use client'
// // app/providers.jsx

// import { ThemeProvider } from 'next-themes'
// import { useEffect, useState } from 'react'

// export function Providers({ children }: { children: React.ReactNode }) {
//   const [isMounted, setIsMounted] = useState(false)

//   useEffect(() => {
//     setIsMounted(true)
//   }, [])

//   // if (!isMounted) return <>{children}</>
//   return (
//     <ThemeProvider defaultTheme='dark' attribute='class' enableSystem>
//       {children}
//     </ThemeProvider>
//   )
// }

// app/providers.jsx
'use client'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme='dark' enableSystem attribute='class'>
      {children}
    </ThemeProvider>
  )
}
