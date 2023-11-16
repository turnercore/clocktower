'use server'
// dataUtilities.ts
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import {
  UUID,
  TowerDatabaseType,
  TowerDatabaseSchema,
  UUIDSchema,
  ServerActionReturn,
} from '@/types/schemas'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { z } from 'zod'

// This will return the tower data, assuming the user is allowed access to it, if not it will return an error

export async function fetchTowerDataSA(
  inputTowerId: UUID,
  inputPublicKey?: string,
): Promise<ServerActionReturn<TowerDatabaseType>> {
  try {
    // Test the input with zod, if error, we're checking for errors anyway
    const towerId = UUIDSchema.parse(inputTowerId)
    const publicKey = inputPublicKey ? z.string().parse(inputPublicKey) : ''

    // Get the tower data from the database
    const supabase = createServerActionClient<Database>({ cookies })
    const { data, error } = await supabase
      .from('towers')
      .select('*')
      .eq('id', towerId)
      .single()
    if (error) throw error

    // Determine if user has access to this tower before we return the data.
    // The user has access if 1. The tower is public and the publicKey is correct
    // 2. The tower is private and the user id is in the users or the admin_users list or is the owner

    // If the tower is public, check the publicKey
    const towerIsPublic = data.public_key !== null && data.public_key !== ''

    // Define a function to check if the user is on the access list
    const isUserOnAccessList = async (): Promise<boolean> => {
      // Else the data is private, so check the user id is in one of the lists
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      if (sessionError) return false
      const userId = sessionData?.session?.user.id
      if (!userId) return false

      // Check if userId is the owner or is contained within the 'users' or 'admin_users' lists
      const userIdIsOwner = userId === data.owner
      const userIdIsInUsersList = data.users?.includes(userId)
      const userIdIsInAdminUsersList = data.admin_users?.includes(userId)

      // If the userId is not in any of the lists, return false
      if (!userIdIsOwner && !userIdIsInUsersList && !userIdIsInAdminUsersList) {
        return false
      } else {
        return true
      }
    }

    // If the user is not on the access list, check if tower is public, if so then we're good, if not return an error
    if (!(await isUserOnAccessList())) {
      if (towerIsPublic) {
        if (data.public_key !== publicKey) {
          return {
            error: 'Incorrect public key for this tower.',
          }
        }
      } else {
        return {
          error: 'You do not have access to this tower.',
        }
      }
    }

    // Convert colors from a jsonb to an array of objects
    data.colors = JSON.parse(JSON.stringify(data.colors))
    return { data: TowerDatabaseSchema.parse(data) as TowerDatabaseType }
  } catch (error) {
    return {
      error: extractErrorMessage(error, 'Unknown error from fetchTowerData.'),
    }
  }
}
