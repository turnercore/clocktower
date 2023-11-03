'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  TowerRowType,
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
} from '@/types'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Helper functions to handle database interactions and data modifications
const insertNewTowerRow = async (
  newRow: TowerRowType,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    const supabase = createServerActionClient<Database>({ cookies })
    const row = TowerRowRowSchema.parse(newRow) as TowerRowRow
    const { data, error } = await supabase
      .from('tower_rows')
      .insert(row)
      .select('*')
    if (error) throw error
    return { data: data[0] }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewRow.'),
    }
  }
}

export default insertNewTowerRow
