// Tower.tsx
import { type UUID } from '@/types/schemas'
import RealtimeTower from './RealtimeTower'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { fetchCompleteTowerDataSA } from '../actions/fetchCompleteTowerDataSA'

interface TowerProps {
  towerId: UUID
  publicKey?: string
}

export const Tower = async ({ towerId, publicKey }: TowerProps) => {
  const { data: towerData, error: towerError } = await fetchCompleteTowerDataSA(
    towerId,
    publicKey,
  )

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
  return <RealtimeTower initialData={towerData} />
}
