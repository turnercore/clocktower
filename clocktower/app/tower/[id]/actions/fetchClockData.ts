'use server'
// Fetch Clock Data
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  ClockData,
  UUIDSchema,
  ServerActionError,
  ClockDataSchema,
} from '@/types'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

export default async function fetchClockData(
  inputClockId: UUID,
): Promise<ClockData | ServerActionError> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const clockId = UUIDSchema.parse(inputClockId)

    // Get the clock data from the database
    const supabase = createServerActionClient<Database>({ cookies })
    const { data, error } = await supabase
      .from('clocks')
      .select('*')
      .eq('id', clockId)
      .single()
    if (error) throw error

    return ClockDataSchema.parse(data)
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchClockData.' }
  }
}
