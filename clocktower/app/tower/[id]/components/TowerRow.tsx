// TowerRow.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { TowerRowRow, UUID } from '@/types/schemas'
import RealtimeTowerRow from './RealtimeTowerRow'
import { Clock } from './Clock'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import React, { Suspense } from 'react'

interface TowerRowServerProps {
  rowId: UUID
}

export const TowerRow: React.FC<TowerRowServerProps> = async ({ rowId }) => {
  const supabase = createServerComponentClient<Database>({ cookies })

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
    .select('id')
    .eq('row_id', rowId)
    .order('position', { ascending: true })

  if (clocksError) {
    console.error(clocksError)
    return <p>Error loading clocks data.</p>
  }

  const initialData: TowerRowRow = rowData as TowerRowRow //TODO: Fix the types to make this not necessary

  const clockIds = clocksData.map((clock) => clock.id)

  // TODO replace the suspense with a loading clock component
  const clocks = clockIds.map((clockId, index) => (
    <Suspense key={index} fallback={<p>Loading clock...</p>}>
      <Clock key={clockId} clockId={clockId} />
    </Suspense>
  ))

  return (
    <Suspense>
      <RealtimeTowerRow initialData={initialData}>{clocks}</RealtimeTowerRow>
    </Suspense>
  )
}
