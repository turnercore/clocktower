import { UUIDSchema, UUID } from '@/types'
import fetchCompleteTowerData from './actions/fetchCompleteTowerData'
import Tower from './components/Tower'
import { z } from 'zod'

export default async function TowerPage({ params }: { params: unknown }) {
  try {
    // 1. Validate the incoming params with Zod
    const validatedParams = z.object({ id: UUIDSchema }).parse(params)
    const { id } = validatedParams as { id: UUID }

    // 2. Fetch and set up the tower data
    const { data: tower, error: fetchError } = await fetchCompleteTowerData(id)
    if (fetchError) throw new Error(fetchError) // If there's an error in fetching, throw it
    if (!tower) throw new Error('Tower not found') // If there's no tower, throw an error

    // 3. Render the tower rows with the fetched data
    return (
      <div>
        <Tower towerId={tower.id} initialData={tower} />
      </div>
    )
  } catch (error) {
    // 3b. Catch and display errors
    console.error(error)
    // Validate Error Message
    const errorMessage: string =
      error instanceof z.ZodError || error instanceof Error
        ? error.message
        : 'An unknown error occurred.'
    return (
      <div className='flex flex-col'>
        <p>There was an error: {errorMessage}</p>
      </div>
    )
  }
}
