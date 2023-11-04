'use server'
// updateTowerColorsServerAction.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  UUID,
  ServerActionReturn,
  HexColorCode,
  HexColorCodeSchema,
  UUIDSchema,
  ColorPaletteSchema,
  ColorPaletteType,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'
import { z } from 'zod'
import setupTowerColorsDictServerAction from '@/actions/setupTowerColorsDictServerAction'
import objectToFormData from '@/tools/objectToFormData'

// Validate input with zod by passing the form object to the schema
const inputSchema = z.object({
  towerId: UUIDSchema,
  entityId: UUIDSchema,
  color: HexColorCodeSchema,
})

// Define the function's arguments and return types
const updateTowerColorsServerAction = async (
  FormData: FormData,
): Promise<ServerActionReturn<{ success: boolean }>> => {
  try {
    // Get the form data into a javascript object
    const form = Object.fromEntries(FormData.entries())

    // Validate data
    const { towerId, entityId, color } = inputSchema.parse(form)

    // Get the user's cookies and create a Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // Get the tower colors from the database
    const { data: towerColors, error: towerColorsError } = await supabase
      .from('towers')
      .select('colors')
      .eq('id', towerId)
      .single()
    // Error Handling
    if (towerColorsError) throw towerColorsError
    if (!towerColors.colors)
      throw new Error('No tower colors returned from database')

    // If the tower colors is just an empty object, or undefined, or null, then let's update the tower colors first and use that object, otherwise we use what we got
    const setupTowerColors =
      Object.keys(towerColors.colors).length === 0
        ? await setupTowerColorsDictServerAction(objectToFormData({ towerId }))
        : towerColors.colors
    // Validate Color Palette
    const validatedTowerColors = ColorPaletteSchema.parse(setupTowerColors)

    // Update the tower colors array
    const newColorsArray = createNewColorsDictionary(
      validatedTowerColors,
      entityId,
      color,
    )

    // Update the database
    const { error: updatedTowerColorsError } = await supabase
      .from('towers')
      .update({ colors: JSON.stringify(newColorsArray) })
      .eq('id', towerId)

    if (updatedTowerColorsError) throw updatedTowerColorsError

    // If we get here, the data is valid and can be used exactly as you would expect
    // to use it in the rest of your server action.
    return { data: { success: true } }
  } catch (error) {
    // 6. If there was an error, return it
    return {
      error: extractErrorMessage(error, 'Unknown error from updateClockData!'),
    }
  }
}

const createNewColorsDictionary = (
  colorPalette: ColorPaletteType,
  entityId: UUID,
  newColor: HexColorCode,
) => {
  // Validate the input arguments using the defined schemas
  const validatedColorPalette = ColorPaletteSchema.parse(colorPalette)
  const validatedEntityId = UUIDSchema.parse(entityId)
  const validatedNewColor = HexColorCodeSchema.parse(newColor)

  // Iterate through each color in the color palette
  for (const color in validatedColorPalette) {
    // Skip prototype properties and only process own properties of the object
    if (validatedColorPalette.hasOwnProperty(color) === false) continue
    // Find the index of the entity ID in the current color's array
    const index = validatedColorPalette[color].indexOf(validatedEntityId)
    // If the entity ID is found, remove it from the array
    if (index !== -1) {
      validatedColorPalette[color].splice(index, 1)
      // If the array is empty after removal, delete the color key from the palette
      if (validatedColorPalette[color].length === 0) {
        delete validatedColorPalette[color]
      }
      // Exit the loop as the entity ID has been found and handled
      break
    }
  }

  // Check if the new color already exists in the palette
  if (validatedColorPalette[validatedNewColor]) {
    // If it exists, add the entity ID to the new color's array
    validatedColorPalette[validatedNewColor].push(validatedEntityId)
  } else {
    // If it doesn't exist, create a new entry with the new color and an array containing the entity ID
    validatedColorPalette[validatedNewColor] = [validatedEntityId]
  }

  // Return the updated color palette
  return validatedColorPalette
}

export default updateTowerColorsServerAction
