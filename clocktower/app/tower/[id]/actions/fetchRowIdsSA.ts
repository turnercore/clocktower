'use server'
// fetchRowIdsSA.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { UUID, UUIDSchema, ServerActionReturn } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import extractErrorMessage from '@/tools/extractErrorMessage'

export async function fetchRowIdsSA(
  inputTowerId: UUID,
): Promise<ServerActionReturn<string[]>> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const towerId = UUIDSchema.parse(inputTowerId)

    // Get the tower data from the database
    const supabase = createServerActionClient<Database>({ cookies })

    // Get the row ids from the database assoisated with this towerId

    const { data, error } = await supabase
      .from('tower_rows')
      .select('id')
      .eq('tower_id', towerId)
      .order('position', { ascending: true })

    if (error) throw error

    // convert the data to the expected format
    const rowIds = data.map((row) => row.id)

    return { data: rowIds }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from fetchTowerData.'),
    }
  }
}
