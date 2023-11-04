import { UUID } from '@/types'
import fetchCompleteTowerData from './actions/fetchCompleteTowerData'
import Tower from './components/Tower'
import extractErrorMessage from '@/tools/extractErrorMessage'

type ExpectedParams = {
  id: UUID
}

export default async function TowerPage({
  params,
}: {
  params: ExpectedParams
}) {
  try {
    // 1. Validate the incoming params
    const { id } = params
    if (!id) throw new Error('No tower ID provided')
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
    return (
      <div className='flex flex-col'>
        <p>There was an error: {extractErrorMessage(error)}</p>
      </div>
    )
  }
}
