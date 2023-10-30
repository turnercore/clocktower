import import { SupabaseClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { fetchTowerData } from './fetchTowerData'
import { fetchRowData } from './fetchRowData'
import { fetchClockData } from './fetchClockData'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { UUID, UUIDSchema } from '@/types'

export default async function fetchCompleteTowerData (inputTowerId: UUID) {
  try {
    // validate input
    const towerId = UUIDSchema.parse(inputTowerId)
    
    // Fetch the tower data
    const supabase = createServerActionClient<Database>({ cookies })
    const { data: towerData, error: towerError } = await fetchTowerData(towerId)
    if (towerError) throw towerError
    
    // Get all rows in the tower
    const { data: towerRows, error: rowError } = await fetchAllRowsInTower(towerId, supabase)
    if (rowError) throw rowError

    // Get all clocks in the tower
    const { data: towerClocks, error: clockError } = await fetchAllClocksInTower(towerId, supabase)
    if (clockError) throw clockError

    // create the return object
    const returnTowerData = {
      ...towerData,
      rows: towerRows.map(row => ({
        ...row,
        clocks: towerClocks.filter(clock => clock.row_id === row.id)
      }))
    
    }
    return returnTowerData
  } catch (error: unknown) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchCompleteTowerData.' }
  }
}

const fetchAllRowsInTower = async (towerId: UUID, supabase: SupabaseClient) => {
  return (await supabase.from('tower_rows').select('*').eq('tower_id', towerId))

}

const fetchAllClocksInTower = async (towerId: UUID, supabase: SupabaseClient) => {
  return (await supabase.from('clocks').select('*').eq('tower_id', towerId))
}

