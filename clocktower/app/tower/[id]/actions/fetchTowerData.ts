'use server'
// dataUtilities.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  TowerData,
  TowerDataSchema,
  UUIDSchema,
  ServerActionReturn,
} from '@/types'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export default async function fetchTowerData(
  inputTowerId: UUID,
): Promise<ServerActionReturn<TowerData>> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const towerId: UUID = UUIDSchema.parse(inputTowerId) as UUID

    // Get the tower data from the database
    const supabase = createServerActionClient<Database>({ cookies })
    const { data, error } = await supabase
      .from('towers')
      .select('*')
      .eq('id', towerId)
      .single()
    if (error) throw error
    return { data: TowerDataSchema.parse(data) }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerData.' }
  }
}
