'use server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { fetchTowerDataSA } from './fetchTowerDataSA'
import { Database } from '@/types/supabase'
import {
  ClockSchema,
  ServerActionReturn,
  TowerRowRowSchema,
  TowerSchema,
  TowerType,
  UUID,
  UUIDSchema,
} from '@/types/schemas'
import extractErrorMessage from '@/tools/extractErrorMessage'

export const fetchCompleteTowerDataSA = async (
  towerId: UUID,
  publicKey?: string,
): Promise<ServerActionReturn<TowerType>> => {
  try {
    // Get the form data into a javascript object

    // validate input
    UUIDSchema.parse(towerId)

    // Fetch the tower data
    const supabase = await createClient()
    const { data: towerDataFetchResult, error: towerDataFetchResultError } =
      await fetchTowerDataSA(towerId, publicKey)

    if (towerDataFetchResultError) throw new Error(towerDataFetchResultError)
    const towerData = towerDataFetchResult

    const [
      { data: towerRows, error: rowError },
      { data: towerClocks, error: clockError },
    ] = await Promise.all([
      fetchAllRowsInTower(towerId, supabase),
      fetchAllClocksInTower(towerId, supabase),
    ])

    if (rowError) throw rowError
    if (clockError) throw clockError

    const clocksByRowId = new Map<UUID, (typeof ClockSchema)['_output'][]>()
    towerClocks?.forEach((clock, index) => {
      const parseResult = ClockSchema.safeParse({
        ...clock,
        color: clock.color || '#E38627',
        name: clock.name || '',
        position: clock.position ?? index,
        users: clock.users || [],
      })

      if (!parseResult.success) {
        console.error(parseResult.error)
        return
      }

      const rowClocks = clocksByRowId.get(parseResult.data.row_id) || []
      rowClocks.push(parseResult.data)
      clocksByRowId.set(parseResult.data.row_id, rowClocks)
    })

    const towerReturn = {
      ...towerData,
      pubic_key: (towerData as any)?.public_key ?? null,
      rows:
        towerRows && towerRows.length > 0
          ? towerRows.flatMap((row, index) => {
              const parsedRow = TowerRowRowSchema.safeParse({
                ...row,
                color: row.color || '#FFA500',
                name: row.name || '',
                position: row.position ?? index,
                users: row.users || [],
              })
              if (!parsedRow.success) {
                console.error(parsedRow.error)
                return []
              }
              return {
                ...parsedRow.data,
                clocks: clocksByRowId.get(parsedRow.data.id) || [],
              }
            })
          : [],
    }
    // Check to see if it passes zod validation, if it does, return it
    return { data: TowerSchema.parse(towerReturn) }
  } catch (error) {
    return {
      error: extractErrorMessage(
        error,
        'Unknown error from fetchCompleteTowerData!!',
      ),
    }
  }
}

const fetchAllRowsInTower = async (
  towerId: UUID,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from('tower_rows')
    .select('*')
    .eq('tower_id', towerId)
    .order('position', { ascending: true })
  return { data, error }
}

const fetchAllClocksInTower = async (
  towerId: UUID,
  supabase: SupabaseClient<Database>,
) => {
  const { data, error } = await supabase
    .from('clocks')
    .select('*')
    .eq('tower_id', towerId)
    .order('position', { ascending: true })
  return { data, error }
}
