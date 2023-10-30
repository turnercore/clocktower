'use server'
// dataUtilities.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { UUID, TowerData, UUIDSchema, ServerActionError } from '@/types'
import { TowerDataSchema } from '@/types'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export default async function fetchTowerData(
  inputTowerId: UUID,
): Promise<TowerData | ServerActionError> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const towerId = UUIDSchema.parse(inputTowerId)

    // Get the tower data from the database
    const supabase = createServerActionClient<Database>({ cookies })
    const { data, error } = await supabase
      .from('towers')
      .select('*')
      .eq('id', towerId)
      .single()
    if (error) throw error

    return TowerDataSchema.parse(data)
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerData.' }
  }
}
