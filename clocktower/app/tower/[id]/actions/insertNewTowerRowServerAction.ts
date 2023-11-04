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
/**
 * Inserts a new row into the "tower_rows" table in the database.
 * @param newRow The new row to be inserted.
 * @returns A promise that resolves to a `ServerActionReturn` object containing the inserted row data, or an error message if the insertion fails.
 */
// This function is called from the client to insert a new tower row into the database.
const insertNewTowerRowServerAction = async (
  newRow: TowerRowType,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Parse the new row into the expected format.
    const row = TowerRowRowSchema.parse(newRow) as TowerRowRow
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

export default insertNewTowerRowServerAction
