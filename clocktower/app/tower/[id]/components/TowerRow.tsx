// TowerRow.tsx
import { createClient } from '@/lib/supabase/server'
import { ClockSchema, ClockType, TowerRowRow, UUID } from '@/types/schemas'
import RealtimeTowerRow from './RealtimeTowerRow'
import React, { Suspense } from 'react'

interface TowerRowServerProps {
  rowId: UUID
}

export const TowerRow: React.FC<TowerRowServerProps> = async ({ rowId }) => {
  const supabase = await createClient()

  // Fetch the row data
  const { data: rowData, error: rowError } = await supabase
    .from('tower_rows')
    .select('*')
    .eq('id', rowId)
    .single()

  if (rowError) {
    console.error(rowError)
    return <p>Error loading tower row data.</p>
  }

  // Fetch clocks associated with this row
  const { data: clocksData, error: clocksError } = await supabase
    .from('clocks')
    .select('*')
    .eq('row_id', rowId)
    .order('position', { ascending: true })

  if (clocksError) {
    console.error(clocksError)
    return <p>Error loading clocks data.</p>
  }

  const initialData: TowerRowRow = rowData as TowerRowRow //TODO: Fix the types to make this not necessary
  const initialClocks: ClockType[] = clocksData.reduce((acc, clock, index) => {
    const parseResult = ClockSchema.safeParse({
      ...clock,
      color: clock.color || '#E38627',
      name: clock.name || '',
      position: clock.position ?? index,
      users: clock.users || [],
    })
    if (parseResult.success) acc.push(parseResult.data)
    return acc
  }, [] as ClockType[])

  return (
    <Suspense>
      <RealtimeTowerRow
        initialData={initialData}
        initialClocks={initialClocks}
      />
    </Suspense>
  )
}
