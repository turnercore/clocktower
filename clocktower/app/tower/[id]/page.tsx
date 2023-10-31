// Import necessary types and functions
import type { UUID } from '@/types'
import { TowerDataSchema, TowerSchema, UUIDSchema } from '@/types'
import fetchCompleteTowerData from './actions/fetchCompleteTowerData'
import updateAndSyncPositions from './actions/updateAndSyncPositions'
import Tower from './components/Tower'
import { z } from 'zod'

// Define the TowerPage component
export default async function TowerPage({ params }: { params: unknown }) {
  try {
    // 1. Validate the incoming params with Zod
    const validatedParams = z.object({ id: UUIDSchema }).parse(params)
    const { id } = validatedParams

    // 2. Fetch and set up the tower data
    const { data: towerData, error: fetchError } = await fetchCompleteTowerData(
      id,
    )
    if (fetchError) throw fetchError // If there's an error in fetching, throw it
    // 2a. Validate the fetched data with Zod
    const tower = TowerSchema.parse(towerData)

    // 3. Update and sync positions of rows
    const { error: updateError } = updateAndSyncPositions({
      entityType: 'row',
      entities: tower.rows!,
    })
    if (updateError) throw updateError // If there's an error in updating positions, throw it

    // Loop through each row and update and sync positions of clocks
    const { error: syncError } = updateAndSyncPositions(
      'clock',
      initialData.rows,
    )
    if (syncError) throw syncError // If there's an error in syncing positions, throw it

    // 3a. Render the Tower component with the populated data
    return (
      <div className='flex flex-col'>
        <Tower initialData={initialData} towerId={id} />
      </div>
    )
  } catch (error) {
    // 3b. Catch and display errors
    console.error(error)
    return (
      <div className='flex flex-col'>
        <p>There was an error: {error.message}</p>
      </div>
    )
  }
}
