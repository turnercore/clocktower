'use server'
// deleteCLock.ts
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID } from '@/types'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Helper functions to handle database interactions and data modifications
/**
 * Deletes a row from the "clocks" table in the database.
 * @param clockId The id of the clock to be deleted.
 * @returns A promise that resolves to a `ServerActionReturn` object containing the deleted row data, or an error message if the deletion fails.
 */
// This function is called from the client to delete a clock from the database.
const deleteClock = async (
  clockId: UUID,
): Promise<ServerActionReturn<{ success: true }>> => {
  try {
    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Delete the clock from the database with supabase.
    const { error } = await supabase.from('clocks').delete().eq('id', clockId)
    // If there was an error deleting the clock, throw the error.
    if (error) throw error
    // If not, Return the success message.
    return { data: { success: true } }
  } catch (error) {
    // If there was an error, return it in a standard format.
    return {
      error: extractErrorMessage(error, 'Unknown error from deleteClock.'),
    }
  }
}

export default deleteClock
