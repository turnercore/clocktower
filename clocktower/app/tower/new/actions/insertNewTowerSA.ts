// insertNewTowerSA.ts
'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  type ServerActionReturn,
  TowerDatabaseSchema,
  type TowerDatabaseType,
} from '@/types/schemas' // Replace with the actual path to your schema
import { type Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
/**
 * Inserts a new tower into the "towers" table in the database.
 * @param newTower The new row to be inserted.
 * @returns A promise that resolves to a `ServerActionReturn` object containing the inserted row data, or an error message if the insertion fails.
 */
const insertNewTowerSA = async (
  newTower: TowerDatabaseType,
): Promise<ServerActionReturn<TowerDatabaseType>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Validate Data and Parse the new row into the expected format with zod.
    const tower = TowerDatabaseSchema.parse(newTower) as TowerDatabaseType
    // Insert the new row into the database with supabase.
    const { data, error } = await supabase
      .from('towers')
      .insert(tower)
      .select('*')
      .single()
    // If there was an error inserting the row, throw the error.
    if (error) throw error
    // If not, Return the inserted row.
    return { data: data as TowerDatabaseType }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewTowerSA.'),
    }
  }
}

export default insertNewTowerSA
