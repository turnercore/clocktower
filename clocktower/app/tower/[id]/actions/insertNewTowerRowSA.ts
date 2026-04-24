// insertNewTowerRowSA.ts
'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  TowerRowType,
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
} from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'

// This function is called from the client to insert a new tower row into the database.
export const insertNewTowerRowSA = async (
  newRow: TowerRowRow | TowerRowType,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = await createClient()
    const row = TowerRowRowSchema.parse(newRow) // this will just drop the clocks property if it's there
    const rowInsert = { ...row, color: row.color ?? undefined }
    // Parse the new row into the expected format.
    // Insert the new row into the database.
    const { error } = await supabase.from('tower_rows').insert(rowInsert)
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
