'use server'
// Fetch Row Data
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  TowerRow,
  UUIDSchema,
  TowerRowSchema,
  ServerActionReturn,
} from '@/types'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export default async function fetchTowerRowData(
  inputRowId: UUID,
): Promise<ServerActionReturn<TowerRow>> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const rowId = UUIDSchema.parse(inputRowId)

    // Get the tower row data from the database
    const supabase = createServerActionClient<Database>({ cookies })
    const { data, error } = await supabase
      .from('tower_row')
      .select('*')
      .eq('id', rowId)
      .single()
    if (error) throw error

    return { data: TowerRowSchema.parse(data) }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerRowData.' }
  }
}
