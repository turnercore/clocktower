'use server'
// dataUtilities.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  UUID,
  TowerData,
  TowerRowData,
  ClockData,
  TowerInitialData,
} from '@/types'
import { sortByPosition } from '@/tools/sortByPosition'

const TowerDataSchema = z.object({
  // Define your schema based on the TowerData type
})

export const fetchTowerData = async (
  supabase: SupabaseClient,
  id: UUID,
): Promise<TowerData> => {
  const { data, error } = await supabase
    .from('towers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return { error: error.message }

  const validatedData = TowerDataSchema.safeParse(data)
  if (!validatedData.success) return { error: 'Invalid tower data' }

  return validatedData.data
}

// Similar validation and error handling for fetchRowData and fetchClockData

// ... Other data manipulation functions
