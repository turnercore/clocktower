'use client'
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { UUID } from '@/types/schemas'
import { createClient } from '@/lib/supabase/client'

export type UserPresence = {
  presence_ref: string
  user_id: UUID
}

type PresenceClient = ReturnType<typeof createClient>

// removeChannel is asynchronous. A new subscription must not reuse the old
// channel while it is leaving, including when navigating back to the same tower.
const pendingRemovals = new WeakMap<PresenceClient, Map<string, Promise<boolean>>>()

export function subscribeToTowerPresence(
  supabase: PresenceClient,
  towerId: UUID,
  onPresence: (users: UserPresence[]) => void,
): () => void {
  if (!towerId) return () => {}

  const topic = `tower_presence:${towerId}`
  let active = true
  let room: RealtimeChannel | undefined
  onPresence([])

  const subscribe = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (!active) return
    if (error || !data.session?.user) {
      if (error) console.error('Unable to check session for tower presence.', error)
      return
    }

    if ((await pendingRemovals.get(supabase)?.get(topic)) === false) return
    if (!active) return

    const userId = data.session.user.id
    const channel = supabase.channel(topic)
    room = channel
    channel
      .on('presence', { event: 'sync' }, () => {
        if (!active) return
        onPresence(Object.values(channel.presenceState<UserPresence>()).flat())
      })
      .subscribe(async (status) => {
        if (!active || status !== 'SUBSCRIBED') return
        try {
          const result = await channel.track({ user_id: userId })
          if (active && result !== 'ok') {
            console.warn('Unable to track tower presence.', result)
          }
        } catch (error) {
          if (active) console.error('Unable to track tower presence.', error)
        }
      })
  }

  void subscribe().catch((error) => {
    if (active) console.error('Unable to subscribe to tower presence.', error)
  })

  return () => {
    active = false
    if (!room) return

    const channel = room
    room = undefined
    let removals = pendingRemovals.get(supabase)
    if (!removals) {
      removals = new Map()
      pendingRemovals.set(supabase, removals)
    }
    const removal = (async () => {
      try {
        const result = await supabase.removeChannel(channel)
        if (result === 'ok' || result === 'timed out') return true
        console.warn('Unable to remove tower presence channel.', result)
      } catch (error) {
        console.error('Unable to remove tower presence channel.', error)
      }
      return false
    })()
    removals.set(topic, removal)
    void removal.finally(() => {
      if (removals.get(topic) === removal) removals.delete(topic)
    })
  }
}

function useRealtimePresence(towerId: UUID): UserPresence[] {
  const [supabase] = useState(() => createClient())
  const [presence, setPresence] = useState<{ towerId: UUID; users: UserPresence[] }>({
    towerId: '',
    users: [],
  })

  useEffect(() => {
    if (!towerId) return
    return subscribeToTowerPresence(supabase, towerId, (users) => {
      setPresence({ towerId, users })
    })
  }, [supabase, towerId])

  return presence.towerId === towerId ? presence.users : []
}

export default useRealtimePresence
