'use server'
// updateClockData.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  UUID,
  ServerActionReturn,
  ClockRowData,
  ClockDatabaseSchema,
  ClockType,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'

// 1. Define the function's arguments and return types
const updateClockDataServerAction = async (
  newClockData: Partial<ClockType>,
  rowId: UUID,
): Promise<ServerActionReturn<ClockRowData>> => {
  try {
    // 2. Get the user's cookies and create a Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // 3. Call the Supabase client and get the response
    const { data, error } = await supabase
      .from('tower_clocks')
      .update(newClockData)
      .eq('id', rowId)
      .select('*')
      .single()

    // 4. If there was an error, throw it
    if (error) throw error

    //LOOK AT We're varifying the data here with zod, but I'm not sure if it's necessary
    const validatedData = ClockDatabaseSchema.parse(data) as ClockRowData
    // 5. If there was no error, return the data
    return { data: validatedData }
  } catch (error) {
    // 6. If there was an error, return it
    return {
      error: extractErrorMessage(error, 'Unknown error from updateClockData.'),
    }
  }
}

export default updateClockDataServerAction
