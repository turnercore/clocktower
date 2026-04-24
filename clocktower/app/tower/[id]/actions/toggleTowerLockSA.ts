'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'

type ReturnType = {
  isLocked: boolean
}

export default async function toggleIsLockedSA({
  towerId,
}: {
  towerId: UUID
}): Promise<ServerActionReturn<ReturnType>> {
  try {
    // validate
    UUIDSchema.parse(towerId)

    // get user that is making this call
    const supabase = await createClient()
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError) throw sessionError
    if (!sessionData.session?.user?.id)
      throw new Error('Requesting user not found.')

    // Ensure that the user id is from the owner of the tower
    const { data: towerData, error: towerError } = await supabase
      .from('towers')
      .select('owner, is_locked')
      .eq('id', towerId)
      .single()

    if (towerError) throw towerError

    if (towerData.owner !== sessionData.session.user.id)
      throw new Error('Requesting user is not the owner of this tower.')

    const { error: updateError } = await supabase
      .from('towers')
      .update({ is_locked: !towerData.is_locked })
      .eq('id', towerId)
      .single()

    if (updateError) throw updateError

    return { data: { isLocked: !towerData.is_locked } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
