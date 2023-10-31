import { createNewTower } from '../../../lib/actions/createNewTower'
import { redirect } from 'next/navigation'
import RefreshButton from './components/RefreshButton'

export default async function NewTowerPage() {
  // Create new tower and add it to the database
  const { data, error } = await createNewTower()

  // If there is an error report it
  if (error) {
    return (
      <div className='flex flex-col'>
        <p>Failed to create new tower.</p>
        <RefreshButton>Try again</RefreshButton>
      </div>
    )
  }
  // Get the new tower's ID
  const newTowerId = data?.id

  // Redirect to the new tower id url
  redirect(`/tower/${newTowerId}`)
}
