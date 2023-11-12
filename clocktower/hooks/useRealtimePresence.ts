// useRealtimePresence.ts
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { UUID } from '@/types/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface UserPresence {
  online: boolean
  lastSeen: string // ISO date string
  // You can add more user-specific presence information here
}

interface PresencePayload {
  id: UUID
  presence: UserPresence
}

// The presence state will map user IDs (which are usually strings) to their presence information
type PresenceState = Record<string, UserPresence>

function useRealtimePresence(towerId: UUID) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const [presence, setPresence] = useState<PresenceState>({})

  useEffect(() => {
    const room = supabase.channel(`tower_presence:${towerId}`)

    room
      .on(
        'presence',
        { event: 'join' },
        (payload: { newPresences: PresencePayload[] }) => {
          console.log('User joined:', payload.newPresences)
          // Logic to update the presence state
        },
      )
      .on(
        'presence',
        { event: 'leave' },
        (payload: { leftPresences: PresencePayload[] }) => {
          console.log('User left:', payload.leftPresences)
          // Logic to update the presence state
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState()
        console.log('Syncing presence:', newState)
        // Logic to update the presence state
      })

    return () => {
      room.unsubscribe()
    }
  }, [towerId])

  return presence
}

export default useRealtimePresence
