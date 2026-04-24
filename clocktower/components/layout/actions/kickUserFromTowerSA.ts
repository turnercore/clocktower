'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUIDSchema } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const inputSchema = z.object({
  towerId: UUIDSchema,
  userId: UUIDSchema,
})

type ReturnType = {
  success: true
}

export default async function kickUserFromTowerSA(
  input: z.infer<typeof inputSchema>,
): Promise<ServerActionReturn<ReturnType>> {
  try {
    const { towerId, userId } = inputSchema.parse(input)
    const supabase = await createClient()
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) throw sessionError
    const requestingUserId = sessionData.session?.user.id
    if (!requestingUserId) throw new Error('Requesting user not found.')

    const { data: towerData, error: towerError } = await supabase
      .from('towers')
      .select('owner, users')
      .eq('id', towerId)
      .single()

    if (towerError) throw towerError
    if (towerData.owner !== requestingUserId) {
      throw new Error('Only the tower owner can remove users from this tower.')
    }
    if (userId === towerData.owner) {
      throw new Error('The tower owner cannot be removed from their own tower.')
    }
    if (!towerData.users?.includes(userId)) {
      throw new Error('User is not in this tower.')
    }

    const { error: removeError } = await supabase.rpc(
      'remove_user_from_tower',
      {
        tower: towerId,
        userid: userId,
      },
    )

    if (removeError) throw removeError

    return { data: { success: true } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
