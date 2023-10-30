'use server'
import { generateName } from '@/lib/tools/clocktowerNameGenerator'
import generateId from '@/lib/tools/generateId'
import { Database } from '@/types/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createNewTower = async () => {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    // Get user id
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!sessionData?.session?.user?.id) throw new Error('No user id found')
    const userId = sessionData.session.user.id

    // Create a new tower
    const newTower = {
      id: generateId(),
      name: generateName(),
      owner: userId,
      users: [userId],
    }

    // Create the tower in the database
    const { error: insertError } = await supabase
      .from('towers')
      .insert(newTower)
    const { error: towersUsersError } = await supabase
      .from('towers_users')
      .insert({ tower_id: newTower.id, user_id: userId })

    if (insertError) throw insertError
    if (towersUsersError) throw towersUsersError

    return { data: newTower }
  } catch (error) {
    return { error }
  }
}
