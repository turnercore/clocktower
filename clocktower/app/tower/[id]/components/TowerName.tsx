import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from '@/types'
import { Database } from '@/types/supabase'

interface TowerNameProps {
  name: string
  towerId: UUID
  className?: string
}

const TowerName: React.FC<TowerNameProps> = ({ name, towerId, className }) => {
  const [towerName, setTowerName] = useState<string>(name || '')
  const supabase = createClientComponentClient<Database>()

  const handleUpdateTower = (payload: any) => {
    if (payload.new.id !== towerId) return
    // Handle the name change
    if (payload.new.name !== towerName) {
      setTowerName(payload.new.name)
    }
  }

  useEffect(() => {
    const subscription = supabase
      .channel(`tower_${towerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'towers',
          filter: `id=eq.${towerId}`,
        },
        handleUpdateTower,
      )
      .subscribe()

    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, towerId])

  return <h1 className={`${className}`}>{towerName}</h1>
}

export default TowerName
