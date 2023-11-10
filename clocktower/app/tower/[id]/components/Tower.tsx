// TowerRow.tsx
import { type UUID } from '@/types/schemas'
import { Suspense } from 'react'
import { fetchTowerDataSA } from '../actions/fetchTowerDataSA'
import { fetchRowIdsSA } from '../actions/fetchRowIdsSA'
import RealtimeTower from './RealtimeTower'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { TowerRow } from './TowerRow'

interface TowerProps {
  towerId: UUID
}

export const Tower = async ({ towerId }: TowerProps) => {
  // Fetch the Tower Data
  const { data: towerData, error: towerError } = await fetchTowerDataSA(towerId)
  if (towerError) {
    console.error(towerError)
    return <p>Error loading tower data. {towerError}</p>
  }

  if (!towerData) {
    return (
      <div>
        <p>Your princess is in another tower. Did you want to </p>
        <Link href='/tower/new'>
          <Button variant='outline'>create a new tower?</Button>
        </Link>
      </div>
    )
  }

  // Fetch RowIds associated with this tower
  const { data: rowIds, error: rowIdsError } = await fetchRowIdsSA(towerId)
  if (rowIdsError) {
    console.error(rowIdsError)
    return <p>Error loading rowIds data. {rowIdsError}</p>
  }

  const rows = rowIds ? (
    rowIds.map((rowId, index) =>
      !rowId ? null : (
        <Suspense key={index} fallback={<p>Loading row...</p>}>
          <TowerRow key={rowId} rowId={rowId} />
        </Suspense>
      ),
    )
  ) : (
    <></>
  )

  // For each rowId fetched, create a TowerRow component wrapped in Suspense
  return (
    <>
      <RealtimeTower initialData={towerData}>{rows}</RealtimeTower>
    </>
  )
}
