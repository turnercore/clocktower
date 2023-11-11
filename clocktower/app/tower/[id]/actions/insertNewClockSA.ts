'use server'
// insertNewClockSA.ts
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  ClockType,
  ServerActionReturn,
  ClockRowData,
  ClockDatabaseSchema,
} from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Helper functions to handle database interactions and data modifications
/**
 * Inserts a new clock row into the database.
 * @param newClock The new clock row to insert.
 * @returns A promise that resolves to the inserted clock row data, or an error if the insertion failed.
 */
const insertNewClockSA = async (
  newClock: ClockType,
): Promise<ServerActionReturn<ClockRowData>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Validate Data and Parse the new row into the expected format with zod.
    const row = ClockDatabaseSchema.parse(newClock) as ClockRowData
    // Insert the new row into the database with supabase.
    const { data, error } = await supabase
      .from('clocks')
      .insert(row)
      .select('*')
      .single()
    // If there was an error inserting the row, throw the error.
    if (error) throw error
    // If not, Return the inserted row.
    return { data: data as ClockRowData }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewClock.'),
    }
  }
}

export default insertNewClockSA
