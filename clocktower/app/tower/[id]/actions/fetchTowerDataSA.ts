'use server'
// dataUtilities.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  TowerDatabaseType,
  TowerDatabaseSchema,
  UUIDSchema,
  ServerActionReturn,
} from '@/types/schemas'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import extractErrorMessage from '@/tools/extractErrorMessage'

export async function fetchTowerDataSA(
  inputTowerId: UUID,
): Promise<ServerActionReturn<TowerDatabaseType>> {
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
    // Convert colors from a jsonb to an array of objects
    data.colors = JSON.parse(JSON.stringify(data.colors))
    return { data: TowerDatabaseSchema.parse(data) as TowerDatabaseType }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from fetchTowerData.'),
    }
  }
}
