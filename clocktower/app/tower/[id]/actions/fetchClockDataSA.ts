'use server'
// Fetch Clock Data
import { createClient } from '@/lib/supabase/server'
import {
  UUID,
  ClockType,
  UUIDSchema,
  ClockSchema,
  ServerActionReturn,
} from '@/types/schemas'
import { Database } from '@/types/supabase'

export const fetchClockData = async (
  inputClockId: UUID,
): Promise<ServerActionReturn<ClockType>> => {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const clockId = UUIDSchema.parse(inputClockId)

    // Get the clock data from the database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clocks')
      .select('*')
      .eq('id', clockId)
      .single()
    if (error) throw error

    return { data: ClockSchema.parse(data) }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchClockData.' }
  }
}
