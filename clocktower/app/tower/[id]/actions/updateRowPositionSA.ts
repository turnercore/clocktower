'use server'

import { createClient } from '@/lib/supabase/server'
import {
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
  UUID,
  UUIDSchema,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { z } from 'zod'

const inputSchema = z.object({
  rowId: UUIDSchema,
  position: z.number().min(0),
})

export const updateRowPositionSA = async ({
  rowId,
  position,
}: {
  rowId: UUID
  position: number
}): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    inputSchema.parse({ rowId, position })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tower_rows')
      .update({ position })
      .eq('id', rowId)
      .select('*')
      .single()

    if (error) throw error
    if (!data) throw new Error('No data returned from updateRowPositionSA')

    return { data: TowerRowRowSchema.parse(data) }
  } catch (error) {
    return {
      error: extractErrorMessage(
        error,
        'Unknown error from updateRowPositionSA.',
      ),
    }
  }
}
