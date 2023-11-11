// updateTowerColorsSA.tsx
'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  ServerActionReturn,
  UUIDSchema,
  HexColorCodeSchema,
  UUID,
  ColorPaletteType,
  HexColorCode,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Define the function's arguments and return types
const inputSchema = z.object({
  towerId: UUIDSchema,
  entityId: UUIDSchema,
  color: HexColorCodeSchema,
})

interface inputType {
  towerId: UUID
  entityId: UUID
  color: HexColorCode
}

export const updateTowerColorsSA = async ({
  towerId,
  entityId,
  color,
}: inputType): Promise<ServerActionReturn<ColorPaletteType>> => {
  console.log('towerId', towerId)
  console.log('entityId', entityId)
  console.log('color', color)
  try {
    const supabase = createServerActionClient<Database>({ cookies })
    // Extract and validate form data
    inputSchema.parse({ towerId, entityId, color })

    // Fetch the current colors object
    const { data: tower, error: fetchError } = await supabase
      .from('towers')
      .select('colors')
      .eq('id', towerId)
      .single()

    if (fetchError) throw fetchError
    if (!tower) throw new Error('Tower not found')
    if (!tower.colors) throw new Error('Tower colors not found')

    let colors: ColorPaletteType = tower.colors as ColorPaletteType

    // Remove entityId from any existing color entry
    Object.keys(colors).forEach((key) => {
      if (colors[key].includes(entityId)) {
        colors[key] = colors[key].filter((id: UUID) => id !== entityId)
        if (colors[key].length === 0) {
          delete colors[key]
        }
      }
    })
    console.log('MADE IT HERE!')

    // Add entityId to the new color entry
    if (!colors[color]) {
      colors[color] = []
    }
    colors[color].push(entityId)

    // Update the colors object in the database
    const { error: updateError } = await supabase
      .from('towers')
      .update({ colors }) // Convert the colors object to a JSON string
      .eq('id', towerId)

    if (updateError) throw updateError

    // Return the new color palette on success
    return { data: colors }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Failed to update tower colors.'),
    }
  }
}
