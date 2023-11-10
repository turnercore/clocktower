'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const inputSchema = z.object({
  inputUserId: UUIDSchema,
  inputTowerId: UUIDSchema,
})

type ReturnType = {
  success: true
}

interface inputType {
  inputUserId: UUID
  inputTowerId: UUID
}

export default async function serverActionSA({
  inputUserId,
  inputTowerId,
}: inputType): Promise<ServerActionReturn<ReturnType>> {
  try {
    // Validate data
    const { inputUserId: userId, inputTowerId: towerId } = inputSchema.parse({
      inputUserId,
      inputTowerId,
    })

    // Create a client object that has the current user's cookies.
    const supabase = createServerActionClient<Database>({ cookies })
    // Upsert userid/towerid record
    const { error: upsertError } = await supabase
      .from('towers_users')
      .upsert({ user_id: userId, tower_id: towerId })

    if (upsertError) throw upsertError

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
