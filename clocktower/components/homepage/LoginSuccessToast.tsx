'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui'

export default function LoginSuccessToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('login') !== 'success') return

    toast({
      title: "You're logged in",
      description: 'Welcome back to Clocktower.',
    })

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('login')
    const queryString = nextParams.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname)
  }, [pathname, router, searchParams])

  return null
}
