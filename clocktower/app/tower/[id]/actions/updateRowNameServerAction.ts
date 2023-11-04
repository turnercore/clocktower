'use server'
// updateRowName.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import {
  UUID,
  ServerActionReturn,
  TowerRowRow,
  TowerRowRowSchema,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { cookies } from 'next/headers'

// 1. Define the function's arguments and return types
const updateRowNameServerAction = async (
  rowId: UUID,
  newRowName: string,
): Promise<ServerActionReturn<TowerRowRow>> => {
  try {
    // 2. Get the user's cookies and create a Supabase client
    const supabase = createServerActionClient<Database>({ cookies })

    // 3. Call the Supabase client and get the response
    const { data, error } = await supabase
      .from('tower_rows')
      .update({ name: newRowName })
      .eq('id', rowId)
      .select('*')
      .single()

    // 4. If there was an error, throw it
    if (error) throw error

    //LOOK AT We're varifying the data here with zod, but I'm not sure if it's necessary
    const validatedData = TowerRowRowSchema.parse(data) as TowerRowRow
    // 5. If there was no error, return the data
    return { data: validatedData }
  } catch (error) {
    // 6. If there was an error, return it
    return {
      error: extractErrorMessage(error, 'Unknown error from updateRowName.'),
    }
  }
}

export default updateRowNameServerAction
