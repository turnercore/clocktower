'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui'

const inviteMetadataKey = 'clocktower_invite_tower_id'
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function InviteAuthRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token')

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

      const queryTowerId = new URLSearchParams(window.location.search).get(
        'tower_invite',
      )
      const metadataTowerId = data.user.user_metadata?.[inviteMetadataKey]
      const towerId = uuidPattern.test(queryTowerId || '')
        ? queryTowerId
        : uuidPattern.test(metadataTowerId || '')
          ? metadataTowerId
          : null

      if (!towerId) {
        router.refresh()
        return
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { [inviteMetadataKey]: null },
      })
      if (metadataError) {
        console.warn('Unable to clear tower invitation metadata.', metadataError)
      }

      router.replace(`/tower/${towerId}`)
      router.refresh()
    }

    void acceptInvite()
  }, [router, supabase])

  return null
}
