'use server'
// updateClockData.ts
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/supabase'
import {
  ServerActionReturn,
  ClockRowData,
  ClockDatabaseSchema,
  UUIDSchema,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { z } from 'zod'

// Define the function's arguments and return types

const inputSchema = z.object({
  clockId: UUIDSchema,
  newClockData: ClockDatabaseSchema.partial(),
})

const userCanUpdateClock = ({
  isClockFillOnlyUpdate,
  towerData,
  userId,
}: {
  isClockFillOnlyUpdate: boolean
  towerData: {
    admin_users: string[] | null
    clocks_locked: boolean
    is_locked: boolean
    owner: string | null
    users: string[] | null
  }
  userId: string
}) => {
  if (towerData.owner === userId) return true

  const isTowerUser =
    towerData.users?.includes(userId) || towerData.admin_users?.includes(userId)
  if (!isTowerUser) return false

  if (isClockFillOnlyUpdate) return !towerData.clocks_locked
  return !towerData.is_locked
}

export const updateClockDataSA = async ({
  clockId,
  newClockData,
}: {
  clockId: string
  newClockData: Partial<ClockRowData>
}): Promise<ServerActionReturn<ClockRowData>> => {
  try {
    // Validate form data with zod
    inputSchema.parse({ clockId, newClockData })

    // 2. Get the user's cookies and create a Supabase client
    const supabase = await createClient()
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const userId = sessionData.session?.user.id
    if (!userId) throw new Error('Requesting user not found.')

    const { data: clockAccessData, error: clockAccessError } = await supabase
      .from('clocks')
      .select(
        'tower_id, towers(owner, users, admin_users, is_locked, clocks_locked)',
      )
      .eq('id', clockId)
      .single()

    if (clockAccessError) throw clockAccessError
    const towerData = Array.isArray(clockAccessData.towers)
      ? clockAccessData.towers[0]
      : clockAccessData.towers
    if (!towerData) throw new Error('Clock tower not found.')

    const updateKeys = Object.keys(newClockData)
    const isClockFillOnlyUpdate =
      updateKeys.length === 1 && updateKeys[0] === 'filled'
    if (
      !userCanUpdateClock({
        isClockFillOnlyUpdate,
        towerData,
        userId,
      })
    ) {
      throw new Error('You do not have permission to update this clock.')
    }

    // 3. Call the Supabase client and get the response
    const { data, error } = await supabase
      .from('clocks')
      .update(newClockData)
      .eq('id', clockId)
      .select('*')
      .single()
    // 4. If there was an error, throw it
    if (error) throw error
    if (!data) {
      throw new Error('No data returned from updateClockDataServerAction')
    }

    const validatedData = ClockDatabaseSchema.parse(data) as ClockRowData

    // If the data that changed was or includes the color field, update the tower colors array as well
    // 1. Check to see if the color field was changed
    // 2. If it was call the updateTowerColorsServerAction

    // 5. If there was no error, return the data
    return { data: validatedData }
  } catch (error) {
    // 6. If there was an error, return it
    console.error(error)
    return {
      error: extractErrorMessage(error, 'Unknown error from updateClockData!'),
    }
  }
}
