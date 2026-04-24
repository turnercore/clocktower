'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'

type ReturnType = {
  clocksLocked: boolean
}

export default async function toggleTowerClockLockSA({
  towerId,
}: {
  towerId: UUID
}): Promise<ServerActionReturn<ReturnType>> {
  try {
    UUIDSchema.parse(towerId)

    const supabase = await createClient()
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!sessionData.session?.user?.id)
      throw new Error('Requesting user not found.')

    const { data: towerData, error: towerError } = await supabase
      .from('towers')
      .select('owner, clocks_locked')
      .eq('id', towerId)
      .single()

    if (towerError) throw towerError

    if (towerData.owner !== sessionData.session.user.id)
      throw new Error('Requesting user is not the owner of this tower.')

    const nextClocksLocked = !towerData.clocks_locked
    const { error: updateError } = await supabase
      .from('towers')
      .update({ clocks_locked: nextClocksLocked })
      .eq('id', towerId)
      .single()

    if (updateError) throw updateError

    return { data: { clocksLocked: nextClocksLocked } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
