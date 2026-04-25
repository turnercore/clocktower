'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { ServerActionReturn, UUID, UUIDSchema } from '@/types/schemas'
import { createClient } from '@/lib/supabase/server'

type ReturnType = {
  iconCursorsEnabled: boolean
}

export default async function toggleTowerIconCursorsSA({
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
      .select('owner, icon_cursors_enabled')
      .eq('id', towerId)
      .single()

    if (towerError) throw towerError

    if (towerData.owner !== sessionData.session.user.id)
      throw new Error('Requesting user is not the owner of this tower.')

    const nextIconCursorsEnabled = !towerData.icon_cursors_enabled
    const { error: updateError } = await supabase
      .from('towers')
      .update({ icon_cursors_enabled: nextIconCursorsEnabled })
      .eq('id', towerId)
      .single()

    if (updateError) throw updateError

    return { data: { iconCursorsEnabled: nextIconCursorsEnabled } }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
