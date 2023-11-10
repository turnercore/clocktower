'use server'
import {
  SupabaseClient,
  createServerActionClient,
} from '@supabase/auth-helpers-nextjs'
import { fetchTowerDataSA } from './fetchTowerDataSA'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import {
  ClockSchema,
  ServerActionReturn,
  TowerSchema,
  TowerType,
  UUID,
  UUIDSchema,
} from '@/types/schemas'
import isUserAuthenticated from '@/tools/isUserAuthenticated'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { z } from 'zod'

// zod schema
const inputSchema = z.object({
  towerId: UUIDSchema,
})

export const fetchCompleteTowerData = async (
  formData: FormData,
): Promise<ServerActionReturn<TowerType>> => {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(formData.entries())

    // validate input
    const { towerId } = inputSchema.parse(form)

    // Fetch the tower data
    const supabase = createServerActionClient<Database>({ cookies })
    const { data: towerDataFetchResult, error: towerDataFetchResultError } =
      await fetchTowerDataSA(towerId)

    if (towerDataFetchResultError) throw new Error(towerDataFetchResultError)
    const towerData = towerDataFetchResult

    // Get all rows in the tower
    const { data: towerRows, error: rowError } = await fetchAllRowsInTower(
      towerId,
      supabase,
    )

    if (rowError) throw rowError

    // Get all clocks in the tower
    const { data: towerClocks, error: clockError } =
      await fetchAllClocksInTower(towerId, supabase)
    if (clockError) throw clockError

    // Ensure that all clocks are the correct type

    // create the return object

    const towerReturn = {
      ...towerData,
      rows:
        towerRows && towerRows.length > 0
          ? towerRows.map((row) => {
              // filter the clocks for the current row
              const rowClocks =
                towerClocks?.filter((clock) => clock.row_id === row.id) || []

              // validate rowClocks using ClockSchema
              const validatedRowClocks = rowClocks.reduce((acc, clock) => {
                try {
                  // Validate each clock, and if valid, add to the accumulator array
                  acc.push(ClockSchema.parse(clock))
                } catch (error) {
                  console.error(error)
                  // This will skip over any clocks that are not validated by ClockSchema
                  // Could be changed to throw an error
                  // Could cause weird behavior if clocks are missing or incorrect
                }
                return acc
              }, [] as (typeof ClockSchema)['_output'][])

              return {
                ...row,
                clocks: validatedRowClocks,
              }
            })
          : [],
    }
    // Check to see if it passes zod validation, if it does, return it
    return { data: TowerSchema.parse(towerReturn) }
  } catch (error) {
    return {
      error: extractErrorMessage(
        error,
        'Unknown error from fetchCompleteTowerData!!',
      ),
    }
  }
}

const fetchAllRowsInTower = async (
  towerId: UUID,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from('tower_rows')
    .select('*')
    .eq('tower_id', towerId)
  return { data, error }
}

const fetchAllClocksInTower = async (
  towerId: UUID,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from('clocks')
    .select('*')
    .eq('tower_id', towerId)
  return { data, error }
}
