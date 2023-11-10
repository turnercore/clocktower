'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  ServerActionReturn,
  UUIDSchema,
  ColorPaletteType,
  UUID,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Define the function's arguments and return types
const inputSchema = z.object({
  towerId: UUIDSchema,
  entityId: UUIDSchema,
})

interface inputType {
  towerId: UUID
  entityId: UUID
}

export const removeTowerColorSA = async ({
  towerId,
  entityId,
}: inputType): Promise<ServerActionReturn<ColorPaletteType>> => {
  try {
    const supabase = createServerActionClient<Database>({ cookies })
    // Extract and validate form data
    inputSchema.parse({ towerId, entityId })

    // Fetch the current colors object
    const { data: tower, error: fetchError } = await supabase
      .from('towers')
      .select('colors')
      .eq('id', towerId)
      .single()

    if (fetchError) throw fetchError
    if (!tower) throw new Error('Tower not found')
    if (!tower.colors) throw new Error('Tower colors not found')

    let colors: ColorPaletteType = JSON.parse(tower.colors as string)

    // Remove entityId from any existing color entry
    Object.keys(colors).forEach((key) => {
      if (colors[key].includes(entityId)) {
        colors[key] = colors[key].filter((id) => id !== entityId)
        if (colors[key].length === 0) {
          delete colors[key]
        }
      }
    })

    // Update the colors object in the database
    const { error: updateError } = await supabase
      .from('towers')
      .update({ colors: JSON.stringify(colors) }) // Make sure to stringify if needed
      .eq('id', towerId)

    if (updateError) throw updateError

    // Return the new color palette on success
    return { data: colors }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Failed to remove tower color.'),
    }
  }
}
