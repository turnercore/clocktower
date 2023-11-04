'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'

const deleteTowerRow = async (
  rowId: UUID,
): Promise<ServerActionReturn<{ success: true }>> => {
  try {
    // validate input data
    const validatedRowId = UUIDSchema.parse(rowId)
    const supabase = createServerActionClient<Database>({ cookies })
    const { error } = await supabase.from('tower_rows').delete().eq('id', rowId)
    if (error) throw error
    else return { data: { success: true } }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewRow.'),
    }
  }
}

export default deleteTowerRow
