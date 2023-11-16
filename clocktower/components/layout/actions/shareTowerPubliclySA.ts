// shareTowerPubliclySA.ts
// Server Action to share a tower publicly assuming the user has permissions to do so. It will return the publicKey
'use server'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { generatePublicKey } from '@/tools/nameGenerators'
import { type ServerActionReturn, type UUID, UUIDSchema } from '@/types/schemas'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

type ReturnType = {
  publicKey: string
}

const domain = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
const PUBLIC_KEY_LENGTH = 5

export default async function shareTowerPubliclySA({
  towerId,
  setPublic,
}: {
  towerId: UUID
  setPublic: boolean
}): Promise<ServerActionReturn<ReturnType>> {
  try {
    // validate
    UUIDSchema.parse(towerId)
    z.boolean().parse(setPublic)

    // get user that is making this call
    const supabase = createServerActionClient({ cookies })
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const userId = sessionData?.session?.user.id
    if (!userId) throw new Error('No user found')

    // get tower
    const { data: towerData, error: towerError } = await supabase
      .from('towers')
      .select('owner, admin_users')
      .eq('id', towerId)
      .single()
    if (towerError) throw towerError

    // Make sure the user requesting this is the owner of the tower or an admin
    const isAdmin =
      towerData?.admin_users?.includes(userId) || towerData?.owner === userId

    if (!isAdmin)
      throw new Error(
        'Requesting user does not have permission to set this tower public.',
      )

    // If all the guard checks are passed, then we can set the tower public or private
    if (setPublic) {
      // 1. Generate a public_key
      const publicKey = generatePublicKey(PUBLIC_KEY_LENGTH)
      // 2. Set the public key on the tower
      const { error: updateTowerError } = await supabase
        .from('towers')
        .update({ public_key: publicKey })
        .eq('id', towerId)

      if (updateTowerError) throw updateTowerError

      return { data: { publicKey } }
    } else {
      // Set to private by deleting publicKey
      const { error: updateTowerError } = await supabase
        .from('towers')
        .update({ public_key: '' })
        .eq('id', towerId)

      if (updateTowerError) throw updateTowerError

      return { data: { publicKey: '' } }
    }
  } catch (error) {
    console.error(error)
    return { error: extractErrorMessage(error) }
  }
}
