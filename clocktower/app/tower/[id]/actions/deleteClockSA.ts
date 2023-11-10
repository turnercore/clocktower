'use server'
// deleteCLock.ts
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { removeTowerColorSA } from './removeTowerColorSA'

// Define the function's arguments and return types
const inputSchema = z.object({
  clockId: UUIDSchema,
  towerId: UUIDSchema,
})

interface inputType {
  clockId: UUID
  towerId: UUID
}

export const deleteClockSA = async ({
  clockId,
  towerId,
}: inputType): Promise<ServerActionReturn<{ success: true }>> => {
  try {
    // Extract form data into a javascript object
    // Validate data with zod
    inputSchema.parse({ clockId, towerId })
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Delete the clock from the database with supabase.
    const { error } = await supabase.from('clocks').delete().eq('id', clockId)
    // If there was an error deleting the clock, throw the error.
    if (error) throw error
    // nonblocking call to update the towers colors
    removeTowerColorSA({ towerId, entityId: clockId })

    // If not, Return the success message.
    return { data: { success: true } }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from deleteClock.'),
    }
  }
}
