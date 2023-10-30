'use client'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

export default function RefreshButton({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return <Button onClick={() => router.refresh()}>{children}</Button>
}
