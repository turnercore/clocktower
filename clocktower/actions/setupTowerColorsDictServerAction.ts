//setupTowerColorsDictSA.tsx
'use server'
import { fetchCompleteTowerDataSA } from '@/app/tower/[id]/actions/fetchCompleteTowerDataSA'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  ColorPaletteSchema,
  ColorPaletteType,
  ServerActionReturn,
  UUID,
  UUIDSchema,
} from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

export const setupTowerColorsDictSA = async (
  inputTowerId: UUID,
): Promise<ServerActionReturn<ColorPaletteType>> => {
  try {
    const colorsDict = {}
    // Validate data and extract it
    const towerId = UUIDSchema.parse(inputTowerId)

    // Get the user's cookies and create a Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // Get complete tower data
    const { data: towerData, error: towerDataError } =
      await fetchCompleteTowerDataSA(towerId)
    if (towerDataError) throw new Error(towerDataError)
    if (!towerData) throw new Error('No tower data returned from fetch')

    // Add all the colors field (along with the ids of the entities that have that color) to the colorsDict
    // 1. Add the tower.color (if it exists) to the colorsDict with the tower id in the array of ids that come after the color code key
    // @ts-ignore
    if (towerData?.color) {
      // @ts-ignore
      colorsDict[towerData.color].push(towerData.id)
    }

    // 2. Add any row.color (if it exists) to the colorsDict with the row id in the array of ids that come after the color code key
    if (towerData.rows) {
      towerData.rows.forEach((row) => {
        // @ts-ignore
        if (row.color) {
          // @ts-ignore
          colorsDict[row.color].push(row.id)
        }
      })
    }

    // 3. Add any clock.color (if it exists) to the colorsDict with the clock id in the array of ids that come after the color code key
    if (towerData.rows) {
      towerData.rows.forEach((row) => {
        if (row.clocks) {
          row.clocks.forEach((clock) => {
            // @ts-ignore
            if (clock.color) {
              // @ts-ignore
              colorsDict[clock.color].push(clock.id)
            }
          })
        }
      })
    }

    // 4. Save the updated colorsDict to the database under the 'towers' table in towers.colors
    const { data: updateResult, error: updateError } = await supabase
      .from('towers')
      .update({ colors: JSON.stringify(colorsDict) })
      .eq('id', towerId)
      .select('*')
      .single()

    // 5. Return the colorsDict
    // Validate the colorsDict
    const validatedReturn = ColorPaletteSchema.parse(colorsDict)
    return { data: validatedReturn }
  } catch (error) {
    return {
      error: extractErrorMessage(
        error,
        'Unknown error from setupTowerColorsDictServerAction!',
      ),
    }
  }
}
