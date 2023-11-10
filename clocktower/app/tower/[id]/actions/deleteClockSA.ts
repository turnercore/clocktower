'use server'
// deleteCLock.ts
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { updateTowerColorsSA } from './updateTowerColorsSA'
import { Form } from 'react-hook-form'
import { removeTowerColorSA } from './removeTowerColorSA'

// Define the function's arguments and return types
const inputSchema = z.object({
  clockId: UUIDSchema,
  towerId: UUIDSchema,
})

export const deleteClockSA = async (
  formData: FormData,
): Promise<ServerActionReturn<{ success: true }>> => {
  try {
    // Extract form data into a javascript object
    const form = Object.fromEntries(formData.entries())
    // Validate form data with zod
    const { clockId } = inputSchema.parse(form)
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Delete the clock from the database with supabase.
    const { error } = await supabase.from('clocks').delete().eq('id', clockId)
    // If there was an error deleting the clock, throw the error.
    if (error) throw error

    // Update the colors array
    const removeColorInput = new FormData()
    removeColorInput.append('towerId', form.towerId)
    removeColorInput.append('entityId', clockId)

    // nonblocking call to update the towers colors
    removeTowerColorSA(removeColorInput)

    // If not, Return the success message.
    return { data: { success: true } }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from deleteClock.'),
    }
  }
}
