// page.tsx
// Description: This is the page that is shown when a user creates a new tower.
import { type TowerDatabaseType } from '@/types/schemas'
import { type UUID } from 'crypto'
import { type Database } from '@/types/supabase'
import RefreshButton from './components/RefreshButton'
import insertNewTowerSA from './actions/insertNewTowerSA'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { generateName } from '@/tools/generateName'

export default async function NewTowerPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  try {
    const { data: getSessionData, error: getSessionError } =
      await supabase.auth.getSession()
    if (getSessionError) throw getSessionError

    const ownerId = getSessionData.session?.user?.id
    if (!ownerId) throw new Error('Must be logged in to create a new tower.')

    //Create a new tower with defaults
    const newTowerId = crypto.randomUUID() as UUID
    const newTower: TowerDatabaseType = {
      id: newTowerId,
      name: generateName(),
      users: [ownerId],
      owner: ownerId,
      colors: {},
    }

    // Create new tower and add it to the database
    const { error: insertError } = await insertNewTowerSA(newTower)

    // If there is an error report it
    if (insertError) throw insertError

    // Redirect to the new tower id url
    redirect(`/tower/${newTowerId}`)
  } catch (error) {
    //Error handling
    console.error(error)
    return (
      <div className='flex flex-col'>
        <p>Failed to create new tower.</p>
        <p>{extractErrorMessage(error)}</p>
        <RefreshButton>Try again</RefreshButton>
      </div>
    )
  }
}
