'use server'
// updateClockData.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  ServerActionReturn,
  ClockRowData,
  ClockDatabaseSchema,
  UUIDSchema,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Define the function's arguments and return types

const inputSchema = z.object({
  clockId: UUIDSchema,
  newClockData: ClockDatabaseSchema.partial(),
})

export const updateClockDataSA = async (
  FormData: FormData,
): Promise<ServerActionReturn<ClockRowData>> => {
  try {
    // Extract form data into a javascript object
    const form = Object.fromEntries(FormData.entries())
    // Validate form data with zod
    const { clockId, newClockData } = inputSchema.parse(form)

    // 2. Get the user's cookies and create a Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // 3. Call the Supabase client and get the response
    const { data, error } = await supabase
      .from('clocks')
      .update(newClockData)
      .eq('id', clockId)
      .select('*')
      .single()
    // 4. If there was an error, throw it
    if (error) throw error
    if (!data) {
      throw new Error('No data returned from updateClockDataServerAction')
    }

    const validatedData = ClockDatabaseSchema.parse(data) as ClockRowData

    // If the data that changed was or includes the color field, update the tower colors array as well
    // 1. Check to see if the color field was changed
    // 2. If it was call the updateTowerColorsServerAction

    // 5. If there was no error, return the data
    return { data: validatedData }
  } catch (error) {
    // 6. If there was an error, return it
    return {
      error: extractErrorMessage(error, 'Unknown error from updateClockData!'),
    }
  }
}
