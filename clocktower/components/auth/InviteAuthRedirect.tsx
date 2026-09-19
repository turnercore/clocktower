'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui'

export default function InviteAuthRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')
    const inviteToken = new URLSearchParams(window.location.search).get(
      'tower_invite_token',
    )

    if (!accessToken || !refreshToken) return

    const acceptInvite = async () => {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      )

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error || !data.user) {
        console.error(error)
        toast({
          title: 'Invitation link could not be completed',
          description:
            'The link may have expired. Ask the tower owner to send another invitation.',
          variant: 'destructive',
        })
        return
      }

      if (!inviteToken) {
        router.refresh()
        return
      }

      let response: Response
      try {
        response = await fetch('/api/tower-invitations/accept', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken }),
        })
      } catch {
        toast({
          title: 'Could not join tower',
          description: 'Check your connection and reopen the invitation link.',
          variant: 'destructive',
        })
        return
      }

      const result = await response.json().catch(() => null)
      const towerId = result?.data?.towerId
      if (!response.ok || typeof towerId !== 'string') {
        toast({
          title: 'Could not join tower',
          description:
            typeof result?.error === 'string'
              ? result.error
              : 'Ask the tower owner to send another invitation.',
          variant: 'destructive',
        })
        return
      }

      router.replace(`/tower/${towerId}`)
      router.refresh()
    }

    void acceptInvite()
  }, [router, supabase])

  return null
}
