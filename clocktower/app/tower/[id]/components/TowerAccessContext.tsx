'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { TowerDatabaseType, UUID } from '@/types/schemas'

type TowerAccessContextValue = {
  currentUserId: UUID | null
  hasEditAccess: boolean
  isOwner: boolean
}

const TowerAccessContext = createContext<TowerAccessContextValue | null>(null)

const userCanEditTower = (
  userId: UUID | null,
  towerData: TowerDatabaseType,
) => {
  if (!userId) return false
  if (userId === towerData.owner) return true
  if (towerData.admin_users?.includes(userId)) return true
  return Boolean(towerData.users?.includes(userId) && !towerData.is_locked)
}

export const TowerAccessProvider = ({
  children,
  towerData,
}: {
  children: React.ReactNode
  towerData: TowerDatabaseType
}) => {
  const [currentUserId, setCurrentUserId] = useState<UUID | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadCurrentUser = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
        return
      }

      if (!isMounted) return
      setCurrentUserId((data.session?.user.id as UUID | undefined) || null)
    }

    loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const value = useMemo<TowerAccessContextValue>(
    () => ({
      currentUserId,
      hasEditAccess: userCanEditTower(currentUserId, towerData),
      isOwner: currentUserId === towerData.owner,
    }),
    [currentUserId, towerData],
  )

  return (
    <TowerAccessContext.Provider value={value}>
      {children}
    </TowerAccessContext.Provider>
  )
}

export const useTowerAccess = () => {
  const context = useContext(TowerAccessContext)
  if (!context) {
    throw new Error('useTowerAccess must be used inside TowerAccessProvider')
  }
  return context
}
