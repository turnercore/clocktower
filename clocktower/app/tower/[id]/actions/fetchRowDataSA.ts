'use server'
// Fetch Row Data
import { createClient } from '@/lib/supabase/server'
import {
  UUID,
  UUIDSchema,
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
} from '@/types/schemas'

export const fetchTowerRowData = async (
  inputRowId: UUID,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const rowId = UUIDSchema.parse(inputRowId)

    // Get the tower row data from the database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tower_rows')
      .select('*')
      .eq('id', rowId)
      .single()
    if (error) throw error

    return { data: TowerRowRowSchema.parse(data) }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerRowData.' }
  }
}
