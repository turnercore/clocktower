// useRealtimePresence.ts
'use client'
import { useEffect, useState } from 'react'
import {
  RealtimePresenceJoinPayload,
  createClient,
} from '@supabase/supabase-js'
import { PresencePayload, UUID } from '@/types/schemas'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { set } from 'date-fns'

type UserPresence = {
  presence_ref: string
  user_id: UUID
}

function useRealtimePresence(towerId: UUID): UserPresence[] {
  const supabase = createClientComponentClient()
  const [presence, setPresence] = useState<UserPresence[]>([])

  const handleUserJoin = (
    payload: RealtimePresenceJoinPayload<UserPresence>,
  ) => {
    const newUsers = payload?.newPresences
    setPresence((prevState) => [...prevState, ...newUsers])
  }

  useEffect(() => {
    const room = supabase.channel(`tower_presence:${towerId}`)

    room
      .on('presence', { event: 'join' }, (payload: any) => {
        console.log('User joined:', payload)
        // Here you would update the presence state with the new user(s)
        handleUserJoin(payload)
      })
      .on('presence', { event: 'leave' }, (payload: any) => {
        console.log('User left:', payload)
        // Here you would remove the user(s) from the presence state
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('Syncing presence:', room.presenceState())
        // Here you would update the presence state with the new user(s)
      })
      .subscribe()

    const joinRoom = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session?.user) {
        console.error('No active session')
        return
      }

      const user_id = data.session.user.id
      // Don't forget to call track to join the presence channel
      room.track({ user_id }).then((response: any) => {
        if (response.error) {
          console.log('Error tracking presence:', response.error)
        }
      })
    }

    joinRoom()

    // Unsubscribe when the component is unmounted or towerId changes
    return () => {
      room.unsubscribe()
    }
  }, [towerId])

  return presence
}

export default useRealtimePresence
