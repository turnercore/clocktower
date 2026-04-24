'use server'
// fetchRowIdsSA.ts
import { createClient } from '@/lib/supabase/server'
import { UUID, UUIDSchema, ServerActionReturn } from '@/types/schemas'
import { Database } from '@/types/supabase'
import extractErrorMessage from '@/tools/extractErrorMessage'

export async function fetchRowIdsSA(
  inputTowerId: UUID,
): Promise<ServerActionReturn<string[]>> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const towerId = UUIDSchema.parse(inputTowerId)

    // Get the tower data from the database
    const supabase = await createClient()

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
