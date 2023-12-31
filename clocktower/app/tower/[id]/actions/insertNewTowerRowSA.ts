// insertNewTowerRowSA.ts
'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  TowerRowType,
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
} from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// This function is called from the client to insert a new tower row into the database.
export const insertNewTowerRowSA = async (
  newRow: TowerRowRow | TowerRowType,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient({ cookies })
    const row = TowerRowRowSchema.parse(newRow) // this will just drop the clocks property if it's there
    // Parse the new row into the expected format.
    // Insert the new row into the database.
    const { error } = await supabase.from('tower_rows').insert(row)
    // If there was an error inserting the row, throw the error.
    if (error) throw error
    // Return the inserted row.
    return { data: row }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewRow.'),
    }
  }
}
