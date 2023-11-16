import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { type TowerType, type UUID } from '@/types/schemas'

const useEditAccess = (towerId: UUID): boolean => {
  const [hasEditAccess, setHasEditAccess] = useState(false)
  const supabase = createClientComponentClient()

  // TODO: This should be aware of changes to the tower if the admin_users, users, owner, or is_locked changes

  useEffect(() => {
    const checkEditAccess = async () => {
      try {
        // Fetch the current user's session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!sessionData?.session?.user?.id) throw new Error('No user id found')
        const userId = sessionData.session.user.id

        // Fetch the tower data
        const { data: towerData, error: towerError } = await supabase
          .from('towers')
          .select('*')
          .eq('id', towerId)
          .single()

        if (towerError) throw towerError
        if (!towerData) throw new Error('Tower not found')

        if (
          userId === towerData.owner ||
          (towerData.admin_users && towerData.admin_users.includes(userId)) ||
          (towerData.users &&
            towerData.users.includes(userId) &&
            !towerData.is_locked)
        ) {
          setHasEditAccess(true)
        }
      } catch (error) {
        console.error(error)
      }
    }
    checkEditAccess()
  }, [towerId])

  return hasEditAccess
}

export default useEditAccess
