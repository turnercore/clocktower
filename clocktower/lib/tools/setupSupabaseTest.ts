'use server'
import { Clock, Tower, TowerDataSchema, TowerRow, UUID } from '@/types'
import { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { taintUniqueValue } from 'next/dist/server/app-render/rsc/taint'

// Hardcoded UUIDs
// The first two test users are manually created in supabase, the rest are created by the tests
export const TEST_USER_ID: UUID = 'c78651e6-dafb-4866-bb14-399c757b0ddd'
export const TEST_USER_ID2: UUID = 'e434ffe9-e279-4466-a68e-b190b28944fd'
// Created by the setup:
export const TEST_TOWER_ID: UUID = '00000000-0000-4000-8000-000000BADCOFFEE'
export const TEST_ROW_ID: UUID = '22222222-2222-4222-8222-222222BADCOFFEE'
export const TEST_ROW_ID2: UUID = '33333333-3333-4333-8333-333333BADCOFFEE'
export const TEST_ROW_ID3: UUID = '44444444-4444-4444-8444-444444BADCOFFEE'
export const TEST_CLOCK_ID: UUID = '55555555-5555-4555-8555-555555BADCOFFEE'
export const TEST_CLOCK_ID2: UUID = '66666666-6666-4666-8666-666666BADCOFFEE'
export const TEST_CLOCK_ID3: UUID = '77777777-7777-4777-8777-777777BADCOFFEE'
// .env variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
// Check for test environment:
const isTestEnv = process.env.NODE_ENV === 'test'

export const setupSupabaseForTesting = async (): Promise<{
  success: boolean
}> => {
  if (!isTestEnv) return { success: false }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars')
      throw new Error('Missing env vars')
    }
    const supabase = new SupabaseClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    )

    // Create the fake tower data:
    const mockClock1: Clock = {
      id: TEST_CLOCK_ID,
      name: 'Clock 1',
      segments: 6,
      color: '#000000',
      filled: 0,
      rounded: false,
      lighten_intensity: 0,
      darken_intensity: 0,
      line_width: 5,
      position: 0,
      row_id: TEST_ROW_ID,
      tower_id: TEST_TOWER_ID,
      users: [TEST_USER_ID, TEST_USER_ID2],
    }
    const mockClock2: Clock = {
      id: TEST_CLOCK_ID2,
      name: 'Clock 2',
      segments: 12,
      color: '#000000',
      filled: 2,
      rounded: true,
      lighten_intensity: 0,
      darken_intensity: 0,
      line_width: 15,
      position: 1,
      row_id: TEST_ROW_ID,
      tower_id: TEST_TOWER_ID,
      users: [TEST_USER_ID, TEST_USER_ID2],
    }
    const mockClock3: Clock = {
      id: TEST_CLOCK_ID3,
      name: 'Clock 3',
      segments: 12,
      color: '#000000',
      filled: 2,
      rounded: true,
      lighten_intensity: 0,
      darken_intensity: 0,
      line_width: 15,
      position: 0,
      row_id: TEST_ROW_ID2,
      tower_id: TEST_TOWER_ID,
      users: [TEST_USER_ID, TEST_USER_ID2],
    }
    const mockRow1: TowerRow = {
      id: TEST_ROW_ID,
      tower_id: TEST_TOWER_ID,
      name: 'Row 1',
      position: 0,
      users: [TEST_USER_ID, TEST_USER_ID2],
      clocks: [mockClock1, mockClock2],
    }
    const mockRow2: TowerRow = {
      id: TEST_ROW_ID2,
      tower_id: TEST_TOWER_ID,
      name: 'Row 2',
      position: 1,
      users: [TEST_USER_ID, TEST_USER_ID2],
      clocks: [mockClock3],
    }
    const mockRow3: TowerRow = {
      id: TEST_ROW_ID3,
      tower_id: TEST_TOWER_ID,
      name: 'Row 3',
      position: 2,
      users: [TEST_USER_ID, TEST_USER_ID2],
      clocks: [],
    }

    const mockTower: Tower = {
      id: TEST_TOWER_ID,
      name: 'Test Tower',
      users: [TEST_USER_ID, TEST_USER_ID2],
      owner: TEST_USER_ID,
      colors: ['#000000', '#ffffff'],
      rows: [mockRow1, mockRow2, mockRow3],
    }

    // Create user 1 and user 2 fake profiles

    // Create the fake tower data in supabase
    // See if the tower data has beed added to the database already
    const { data: towers, error: towersError } = await supabase
      .from('towers')
      .select('*')
      .eq('id', TEST_TOWER_ID)
      .single()
    if (towers) return { success: true }
    // Create the Fake tower in the database ( will be the tower minus the rows field)
    type SupabaseTowerType = {
      id?: string | undefined
      name?: string | null | undefined
      users?: string[] | null | undefined
      owner?: string | null | undefined
      colors?: string[] | null | undefined
    }

    const supabaseTower: SupabaseTowerType = TowerDataSchema.parse({
      id: mockTower.id,
      name: mockTower.name,
      users: mockTower.users,
      owner: mockTower.owner,
      colors: mockTower.colors,
    })

    // Upsert tower
    await supabase
      .from('towers')
      .upsert([supabaseTower], { onConflict: 'id' })
      .then((res) => {
        if (res.error) throw res.error
      })

    // Upsert rows
    await supabase
      .from('tower_row')
      .upsert([mockRow1, mockRow2, mockRow3], { onConflict: 'id' })
      .then((res) => {
        if (res.error) throw res.error
      })

    // Upsert clocks
    await supabase
      .from('clocks')
      .upsert([mockClock1, mockClock2, mockClock3], { onConflict: 'id' })
      .then((res) => {
        if (res.error) throw res.error
      })

    // Create towers_users connections for tower and user 1 and user 2
    const towersUsers = [
      { tower_id: TEST_TOWER_ID, user_id: TEST_USER_ID },
      { tower_id: TEST_TOWER_ID, user_id: TEST_USER_ID2 },
    ]
    await supabase
      .from('towers_users')
      .upsert(towersUsers)
      .then((res) => {
        if (res.error) throw res.error
      })

    // Create fake profiles for users
    const user1Profile = {
      id: TEST_USER_ID,
      username: 'testuser1',
      icon: 'D20',
      icon_color: '#000000',
      bg_color: '#ffffff',
      color: '#000000',
    }
    const user2Profile = {
      id: TEST_USER_ID2,
      username: 'testuser2',
      icon: 'D20',
      icon_color: '#000000',
      bg_color: '#ffffff',
      color: '#000000',
    }

    // Upsert profiles
    await supabase
      .from('profiles')
      .upsert([user1Profile, user2Profile])
      .then((res) => {
        if (res.error) throw res.error
      })

    // Make friends
    const userIdField = user1Profile.id
    const friendIdField = user2Profile.id
    await supabase
      .from('friends')
      .upsert({ user_id: userIdField, friend_id: friendIdField })
      .then((res) => {
        if (res.error) throw res.error
      })

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export const cleanUpSupabaseAfterTesting = async (): Promise<{
  success: boolean
}> => {
  if (!isTestEnv) return { success: false }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars')
      throw new Error('Missing env vars')
    }
    const supabase = new SupabaseClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    )

    // Deleting the friend relationships
    await supabase
      .from('friends')
      .delete()
      .or(`user_id.eq.${TEST_USER_ID},friend_id.eq.${TEST_USER_ID2}`)

    // Deleting the user profiles
    await supabase
      .from('profiles')
      .delete()
      .match({ id: [TEST_USER_ID, TEST_USER_ID2] })

    // Deleting the clock entries
    await supabase
      .from('clocks')
      .delete()
      .match({ id: [TEST_CLOCK_ID, TEST_CLOCK_ID2, TEST_CLOCK_ID3] })

    // Deleting the tower rows
    await supabase
      .from('tower_row')
      .delete()
      .match({ id: [TEST_ROW_ID, TEST_ROW_ID2, TEST_ROW_ID3] })

    // Deleting the tower and user relationships
    await supabase
      .from('towers_users')
      .delete()
      .or(
        `tower_id.eq.${TEST_TOWER_ID},user_id.in.(${TEST_USER_ID},${TEST_USER_ID2})`,
      )

    // Deleting the tower entries
    await supabase.from('towers').delete().match({ id: TEST_TOWER_ID })

    return { success: true }
  } catch (error) {
    console.error('Error cleaning up after testing:', error)
    return { success: false }
  }
}
