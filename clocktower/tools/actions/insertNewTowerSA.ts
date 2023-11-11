// insertNewTowerSA.ts
'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  type ServerActionReturn,
  UUIDSchema,
  UUID,
  TowerRowRow,
  ClockType,
} from '@/types/schemas' // Replace with the actual path to your schema
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateName } from '../generateName'
/**
 * Inserts a new tower into the "towers" table in the database.
 * @param newTowerId The new row to be inserted.
 * @returns A promise that resolves to a `ServerActionReturn` object containing the inserted row data, or an error message if the insertion fails.
 */
const insertNewTowerSA = async (
  inputTowerId: UUID,
): Promise<ServerActionReturn<{ success: boolean }>> => {
  try {
    // Validate Input
    const towerId = UUIDSchema.parse(inputTowerId)
    const supabase = createServerActionClient({ cookies })
    // Get user session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError

    // Get user id
    const userId = sessionData.session?.user?.id
    if (!userId) throw new Error('No user id found.')

    // Create default tower data
    const rowId = crypto.randomUUID()
    const clockId = crypto.randomUUID()
    const towerData = {
      id: towerId,
      name: generateName(),
      colors: { '#99D5C9': [clockId], '#000000': [rowId] },
      users: [userId],
      owner: userId,
    }

    console.log('creating new tower', towerId)

    // Create a client object that has the current user's cookies.
    // Insert the new row into the database with supabase.
    const { error } = await supabase.from('towers').insert(towerData)
    // If there was an error inserting the row, throw the error.
    if (error) throw error

    console.log('inserting user and tower record', userId, towerId)
    // Insert users/towers record
    const { error: upsertError } = await supabase
      .from('towers_users')
      .upsert({ user_id: userId, tower_id: towerId })

    // Create a first row
    const defaultRowData: TowerRowRow = {
      id: rowId,
      tower_id: towerId,
      name: "Baby's First Row",
      position: 0,
      color: '#000000',
      users: [userId],
    }

    // Insert the new row into the database with supabase.
    const { error: rowError } = await supabase
      .from('tower_rows')
      .insert(defaultRowData)
    // If there was an error inserting the row, throw the error.
    if (rowError) throw rowError

    // Create a default clock as well
    const defaultClockData: ClockType = {
      id: clockId,
      tower_id: towerId,
      name: '',
      position: 0,
      color: '#99D5C9',
      users: [userId],
      row_id: rowId,
      lighten_intensity: 0.35,
      darken_intensity: 0.5,
      line_width: 20,
      rounded: false,
      filled: null,
      segments: 6,
    }

    // Insert the new clock into the database with supabase.
    const { error: clockError } = await supabase
      .from('clocks')
      .insert(defaultClockData)

    // If not, Return the inserted row.
    return { data: { success: true } }
  } catch (error) {
    // If there was an error, return it in a standard format.
    console.error(error)
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewTowerSA.'),
    }
  }
}

export default insertNewTowerSA
