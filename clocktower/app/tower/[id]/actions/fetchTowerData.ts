'use server'
// dataUtilities.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  TowerDatabaseType,
  TowerDatabaseSchema,
  UUIDSchema,
  ServerActionReturn,
} from '@/types'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export default async function fetchTowerData(
  inputTowerId: UUID,
): Promise<ServerActionReturn<TowerDatabaseType>> {
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
    return { data: TowerDatabaseSchema.parse(data) as TowerDatabaseType }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerData.' }
  }
}
