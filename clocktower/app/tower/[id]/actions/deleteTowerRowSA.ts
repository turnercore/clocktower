'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { removeTowerColorSA } from './removeTowerColorSA'
import { z } from 'zod'

const inputSchema = z.object({
  rowId: UUIDSchema,
  towerId: UUIDSchema,
})

export const deleteTowerRowSA = async (
  formData: FormData,
): Promise<ServerActionReturn<{ success: true }>> => {
  try {
    // validate input data
    const form = Object.fromEntries(formData.entries())
    const { rowId, towerId } = inputSchema.parse(form)

    const supabase = createServerActionClient<Database>({ cookies })
    const { error } = await supabase
      .from('tower_rows')
      .delete()
      .eq('id', rowId)
      .select()
    if (error) throw error

    // Update the colors
    const removeColorInput = new FormData()
    removeColorInput.append('towerId', towerId)
    removeColorInput.append('rowId', rowId)
    removeTowerColorSA(removeColorInput)

    return { data: { success: true } }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from insertNewRow.'),
    }
  }
}
