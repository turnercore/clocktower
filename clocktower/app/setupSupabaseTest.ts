'use server'
import {
  ClockType,
  TowerType,
  TowerRowType,
  UUID,
  UserType,
  TowerDatabaseType,
} from '@/types'
import { Database } from '@/types/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Hardcoded UUIDs
// The first two test users are manually created in supabase, the rest are created by the tests
const TEST_USER_ID: UUID = 'c78651e6-dafb-4866-bb14-399c757b0ddd'
const TEST_USER_ID2: UUID = 'e434ffe9-e279-4466-a68e-b190b28944fd'
// Created by the setup:
const TEST_TOWER_ID: UUID = '00000000-0000-4000-8000-00000000beef'
const TEST_ROW_ID: UUID = '22222222-2222-4222-8222-22222222beef'
const TEST_ROW_ID2: UUID = '33333333-3333-4333-8333-33333333beef'
const TEST_ROW_ID3: UUID = '44444444-4444-4444-8444-44444444beef'
const TEST_CLOCK_ID: UUID = '55555555-5555-4555-8555-55555555beef'
const TEST_CLOCK_ID2: UUID = '66666666-6666-4666-8666-66666666beef'
const TEST_CLOCK_ID3: UUID = '77777777-7777-4777-8777-77777777beef'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''
// Create the fake tower data:
const mockClock1: ClockType = {
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
const mockClock2: ClockType = {
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
const mockClock3: ClockType = {
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
const mockRow1: TowerRowType = {
  id: TEST_ROW_ID,
  tower_id: TEST_TOWER_ID,
  name: 'Row 1',
  position: 0,
  users: [TEST_USER_ID, TEST_USER_ID2],
  clocks: [mockClock1, mockClock2],
}
const mockRow2: TowerRowType = {
  id: TEST_ROW_ID2,
  tower_id: TEST_TOWER_ID,
  name: 'Row 2',
  position: 1,
  users: [TEST_USER_ID, TEST_USER_ID2],
  clocks: [mockClock3],
}
const mockRow3: TowerRowType = {
  id: TEST_ROW_ID3,
  tower_id: TEST_TOWER_ID,
  name: 'Row 3',
  position: 2,
  users: [TEST_USER_ID, TEST_USER_ID2],
  clocks: [],
}

const mockTower: TowerType = {
  id: TEST_TOWER_ID,
  name: 'Test Tower',
  users: [TEST_USER_ID, TEST_USER_ID2],
  owner: TEST_USER_ID,
  colors: [
    {
      clocksUsing: [mockClock1.id],
      hex: mockClock1.color,
    },
    {
      clocksUsing: [mockClock2.id],
      hex: mockClock2.color,
    },
    {
      clocksUsing: [mockClock3.id],
      hex: mockClock3.color,
    },
  ],
  rows: [mockRow1, mockRow2, mockRow3],
}

// Create fake profiles for users
const user1Profile: UserType = {
  id: TEST_USER_ID,
  username: 'testuser1',
  icon: 'D20',
  icon_color: '#000000',
  bg_color: '#ffffff',
}
const user2Profile = {
  id: TEST_USER_ID2,
  username: 'testuser2',
  icon: 'D20',
  icon_color: '#000000',
  bg_color: '#ffffff',
}

export const addSupabaseMockData = async (): Promise<{
  success: boolean
}> => {
  console.log('Setting up supabase for testing')
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars')
      throw new Error('Missing env vars')
    }

    const supabase = new SupabaseClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client initialized.')

    // See if the tower data has been added to the database already
    const { data: towers, error: towersError } = await supabase
      .from('towers')
      .select('*')
      .eq('id', TEST_TOWER_ID)
      .single()

    console.log('Fetched towers:', towers)
    console.log('Towers fetch error:', towersError)

    const supabaseTower: TowerDatabaseType = {
      id: mockTower.id,
      name: mockTower.name,
      users: mockTower.users,
      owner: mockTower.owner,
      colors: mockTower.colors,
    }
    console.log('Supabase Tower:', supabaseTower)

    // Upsert tower
    await supabase
      .from('towers')
      .upsert([supabaseTower], { onConflict: 'id' })
      .then((res) => {
        console.log('Upsert tower result:', res)
        if (res.error) throw res.error
      })

    // Upsert rows
    // Remove the 'clocks' field from the rows
    const rowsWithoutClocks = mockTower.rows.map((row) => {
      const { clocks, ...rowWithoutClocks } = row
      return rowWithoutClocks
    })
    await supabase
      .from('tower_rows')
      .upsert(rowsWithoutClocks, { onConflict: 'id' })
      .then((res) => {
        console.log('Upsert rows result:', res)
        if (res.error) throw res.error
      })

    // Upsert clocks
    await supabase
      .from('clocks')
      .upsert([mockClock1, mockClock2, mockClock3], { onConflict: 'id' })
      .then((res) => {
        console.log('Upsert clocks result:', res)
        if (res.error) throw res.error
      })

    const towersUsers = [
      { tower_id: TEST_TOWER_ID, user_id: TEST_USER_ID },
      { tower_id: TEST_TOWER_ID, user_id: TEST_USER_ID2 },
    ]
    console.log('Towers Users:', towersUsers)

    // Create towers_users connections for tower and user 1 and user 2
    await supabase
      .from('towers_users')
      .upsert(towersUsers)
      .then((res) => {
        console.log('Upsert towers_users result:', res)
        if (res.error) throw res.error
      })

    // Upsert profiles
    await supabase
      .from('profiles')
      .upsert([user1Profile, user2Profile])
      .then((res) => {
        console.log('Upsert profiles result:', res)
        if (res.error) throw res.error
      })

    const userIdField = user1Profile.id
    const friendIdField = user2Profile.id
    console.log('User IDs for friendship:', userIdField, friendIdField)

    // Make friends
    await supabase
      .from('friends')
      .upsert({ user_id: userIdField, friend_id: friendIdField })
      .then((res) => {
        console.log('Upsert friends result:', res)
        if (res.error) throw res.error
      })

    console.log('Setup completed successfully.')
    return { success: true }
  } catch (error) {
    console.error('Error during setup:', error)
    return { success: false }
  }
}

export const testSupabaseMockData = async (): Promise<boolean> => {
  revalidatePath('/')
  try {
    const supabase = new SupabaseClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
    )

    // Test towers
    const { data: testing } = await supabase.from('towers').select('*')
    console.log('Testing:', testing)
    const { data: towers } = await supabase
      .from('towers')
      .select('*')
      .eq('id', TEST_TOWER_ID)
      .single()
    if (!towers || towers.id !== TEST_TOWER_ID) {
      console.error('Tower test failed.')
      console.log('Towers:', towers)
      return false
    }
    console.log('Towers test passed successfully.')
    console.log('Towers: ' + JSON.stringify(towers, null, 2))

    // Test tower_rows
    const { data: towerRows } = await supabase
      .from('tower_rows')
      .select('*')
      .eq('tower_id', TEST_TOWER_ID)
    if (!towerRows || towerRows.length !== mockTower.rows.length) {
      console.error('Tower rows test failed.')
      console.log('Tower rows:', towerRows)
      return false
    }

    // Test clocks
    const { data: clocks } = await supabase
      .from('clocks')
      .select('*')
      .eq('tower_id', TEST_TOWER_ID)
    if (!clocks || clocks.length !== 3) {
      console.error('Clocks test failed.')
      console.log('Clocks:', clocks)
      return false
    }

    // Test towers_users
    const { data: towersUsers } = await supabase
      .from('towers_users')
      .select('*')
      .eq('tower_id', TEST_TOWER_ID)
    if (!towersUsers || towersUsers.length !== 2) {
      console.error('Towers users test failed.')
      return false
    }

    // Test profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [user1Profile.id, user2Profile.id])
    if (!profiles || profiles.length !== 2) {
      console.error('Profiles test failed.')
      return false
    }

    // Test friends
    const { data: friends } = await supabase
      .from('friends')
      .select('*')
      .in('user_id', [user1Profile.id, user2Profile.id])
    if (
      !friends ||
      friends.length !== 1 ||
      friends[0].friend_id !== user2Profile.id
    ) {
      console.error('Friends test failed.')
      return false
    }

    console.log('All tests passed successfully.')
    return true
  } catch (error) {
    console.error('Error during testing:', error)
    return false
  }
}

export const clearSupabaseMockData = async (): Promise<{
  success: boolean
}> => {
  console.log('Resetting supabase mock data')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    throw new Error('Missing env vars')
  }

  const supabase = new SupabaseClient<Database>(supabaseUrl, supabaseServiceKey)
  console.log('Supabase client initialized.')

  try {
    // Delete clock data
    await supabase
      .from('clocks')
      .delete()
      .in('id', [TEST_CLOCK_ID, TEST_CLOCK_ID2, TEST_CLOCK_ID3])

    // Delete row data
    await supabase
      .from('rows')
      .delete()
      .in('id', [TEST_ROW_ID, TEST_ROW_ID2, TEST_ROW_ID3])

    // Delete towers_users data
    await supabase
      .from('towers_users')
      .delete()
      .eq('tower_id', TEST_TOWER_ID)
      .in('user_id', [TEST_USER_ID, TEST_USER_ID2])

    // Delete tower data
    await supabase.from('towers').delete().eq('id', TEST_TOWER_ID)

    // Delete friends data
    await supabase
      .from('friends')
      .delete()
      .in('user_id', [TEST_USER_ID, TEST_USER_ID2])

    // Delete user profiles
    await supabase
      .from('profiles')
      .delete()
      .in('id', [TEST_USER_ID, TEST_USER_ID2])

    console.log('Mock data reset complete.')
    return { success: true }
  } catch (error) {
    console.error('Error resetting mock data:', error)
    return { success: false }
  }
}
