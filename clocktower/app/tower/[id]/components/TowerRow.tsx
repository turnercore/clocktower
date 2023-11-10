// TowerRow.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { TowerRowRow, UUID, ClockRowData } from '@/types/schemas'
import { RealtimeTowerRow } from './RealtimeTowerRow'
import { Clock } from './Clock'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import React, { Suspense } from 'react'
import { sortByPosition } from '@/tools/sortByPosition'

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

  if (clocksError) {
    console.error(clocksError)
    return <p>Error loading clocks data.</p>
  }

  const initialData: TowerRowRow = rowData as TowerRowRow //TODO: Fix the types to make this not necessary

  const sortedClocks = sortByPosition(clocksData as ClockRowData[])
  // Function to handle delete which you will have to define or pass as a prop
  const handleDelete = (clockId: UUID) => {
    console.log('Clock deleted with ID:', clockId)
    // Implement deletion logic
  }

  // TODO replace the suspense with a loading clock component
  return (
    <RealtimeTowerRow initialData={initialData}>
      {sortedClocks.map((clock) =>
        !clock ? null : (
          <Suspense key={clock.id} fallback={<p>Loading clock...</p>}>
            <Clock clockId={clock.id} />
          </Suspense>
        ),
      )}
    </RealtimeTowerRow>
  )
}