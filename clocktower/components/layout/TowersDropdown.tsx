import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from 'next/headers'
import { TowersDropdownComponent } from "./TowersDropdownComponent"

export async function TowersDropdown() {
  // Init supabase
  const supabase = createServerComponentClient({ cookies })
  // Get the user's id
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  // Handle errors
  if (sessionError || !sessionData || !sessionData.session?.user.id) {
    console.error(sessionError)
    return
  }
  const userId = sessionData.session.user.id

  // Fetch the towers the user has access to using the join table
  const { data: towerAccessData, error: towerAccessError } = await supabase.from('towers_users').select('towerId').eq('userId', userId)
  // Handle errors
  if (towerAccessError) {
    console.error(towerAccessError)
    return
  }
  // Get the tower ids from the join table
  const towerIds = towerAccessData?.map(tower => tower.towerId) || []
  // Fetch the towers from the tower ids
  const { data: towersData, error: towersError } = await supabase.from('towers').select('*').in('id', towerIds)
  // Handle errors
  if (towersError) {
    console.error(towersError)
    return
  }
  // Get the towers
  const towers = towersData || []

  return (
    <TowersDropdownComponent towers={towers} />
  )
}
