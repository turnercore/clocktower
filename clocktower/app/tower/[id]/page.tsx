import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClockData, ColorPaletteItem, TowerData, TowerInitialData, TowerRowData, TowerRowInitialData, UUID } from '@/types'
import Tower from '@/app/tower/components/Tower'
import { isValidUUID } from '@/tools/isValidUUID'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { generateName } from '@/tools/clocktowerNameGenerator'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { sortByPosition } from '@/tools/sortByPosition'
import { isValidHexColor } from '@/tools/isValidHexColor'
export const dynamic = 'force-dynamic'

export default async function TowerPage({ params }: { params: { id: UUID | string } }) {
  const supabase = createServerComponentClient({cookies})
  const id = params.id
  // See if it's a new tower
  if (id === 'new') {
    // Create a new tower and redirect to its page
    // Create new tower Id
    const newTowerId = crypto.randomUUID() as UUID
    // Create new tower and add it to the database
    const error = await createNewTower(supabase, newTowerId)
    // If there is an error report it
    if (error) console.error(error)
    // Otherwise redirect to the new tower id url
    else redirectToNewTowerId(newTowerId)
  } 

  // If UUID is not valid in url then throw an error
  else if(!id || !isValidUUID(id)) {
    // Handle invalid UUIDs
    return (
      <div className="flex flex-col">
        <p>That tower does not exist. Did you mean to create a new one?</p>
      </div>
    )
  } 

  // Valid UUID, fetch tower data, if it doesn't exist then create tower with a new id (to prevent exploits) and redirect to that id
  else {
    // Fetch tower data
    let initialData: TowerInitialData
    try {
      // Ensure that the tower already exists
      const {data: towerExistsData, error: towerExistsError} = await supabase.from('towers').select('id').eq('id', id as UUID)
      if (towerExistsError) throw towerExistsError
      if (!towerExistsData || towerExistsData.length === 0) {
        // This is a new tower
        const newTowerId = crypto.randomUUID() as UUID
        const error = await createNewTower(supabase, newTowerId)
        if (error) throw error
        else redirectToNewTowerId(newTowerId)
      }

      // Great, tower exists, let's get all the data
      const towerData = await fetchTowerData(supabase, id as UUID)
      const rowsData = await fetchRowData(supabase, id as UUID)
      const clocksData = await fetchClockData(supabase, id as UUID)

      //Set up initialData
      initialData = setInitialData(towerData, rowsData, clocksData, supabase)
      const initialUsedColors: ColorPaletteItem[] = getUsedColors(initialData)

      // Render the tower component with the initial data
      return (
        <div className="flex flex-col">
          <Tower initialData={initialData} initialUsedColors={initialUsedColors} towerId={id as UUID} />
        </div>)

    } catch (error) {
      console.error(error)
      return (
        <div className="flex flex-col">
          <p>There was an error fetching the tower data. Please try again.</p>
        </div>
      )
    }
  }
}


/// ------- Helper Functions ------- ///

const createNewTower = async (supabase: SupabaseClient, newTowerId: UUID) => {
  try {
    // Get user id
    const {data: sessionData, error: sessionError} = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!sessionData?.session?.user?.id) throw new Error("No user id found")
    const userId = sessionData.session.user.id

    // Create a new tower
    const newTower = {
      id: newTowerId,
      name: generateName(),
      owner: userId,
      users: [userId],
    }

    //Create the tower in the database
    const {error: insertError} = await supabase.from('towers').insert(newTower)
    const {error: towersUsersError} = await supabase.from('towers_users').insert({tower_id: newTowerId, user_id: userId})

    if (insertError) throw insertError
    if (towersUsersError) throw towersUsersError
  } catch (error) {
    return {error}
  }
  // Update the towers_users table
}

const redirectToNewTowerId = (newTowerId: UUID) => {
  //rewrite the url to the new tower's id
  const headersList = headers();
  const domain = headersList.get('host') || "";
  const protocol = headersList.get('protocol') || "http://";
  redirect(protocol + domain + `/tower/${newTowerId}`)
}

// Fetches data for a specific tower by its ID
const fetchTowerData = async (supabase: SupabaseClient, id: UUID): Promise<TowerData> => {
  const { data, error } = await supabase
    .from('towers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as TowerData
}

const fetchRowData = async (supabase: SupabaseClient, id: UUID): Promise<TowerRowData[]> => {
  const { data, error } = await supabase
    .from('tower_rows')
    .select('*')
    .eq('tower_id', id)
  if (error) throw error
  return data as TowerRowData[]
}

const fetchClockData = async (supabase: SupabaseClient, id: UUID): Promise<ClockData[]> => {
  const { data, error } = await supabase
    .from('clocks')
    .select('*')
    .eq('tower_id', id)
  if (error) throw error
  return data as ClockData[]
}

const setInitialData = (towerData: TowerData, rowsData: TowerRowData[], clocksData: ClockData[], supabase: SupabaseClient) => {
  // Sort rows by their position
  const sortedRowData = sortByPosition(rowsData) as TowerRowData[]
  const sortedClockData = sortByPosition(clocksData) as ClockData[]
  // Update the row positions and sync with the server
  void updateAndSyncRowPositions(sortedRowData, rowsData, supabase)
  void updateAndSyncClockPositions(sortedClockData, clocksData, supabase)

  // Group clocks by their row ID
  const clocksGroupedByRow: { [key: string]: ClockData[] } = {}
  clocksData.forEach(clock => {
    const rowId = clock.row_id
    if (!clocksGroupedByRow[rowId]) {
      clocksGroupedByRow[rowId] = []
    }
    clocksGroupedByRow[rowId].push(clock)
  })

  // Sort each group of clocks by their position and attach to their respective rows
  const initialRowsData: (TowerRowInitialData | null)[] = sortedRowData.map(row => {
    if (row) {
      const clocksForThisRow = clocksGroupedByRow[row.id] || []
      const sortedClocksForThisRow = sortByPosition(clocksForThisRow) as ClockData[]
      return {
        ...row,
        clocks: sortedClocksForThisRow
      }
    }
    return null // Or however you want to handle null or undefined rows
  })
  // Remove null rows data
  const filteredInitialRowsData = initialRowsData.filter(row => row !== null)

  return {
    ...towerData,
    rows: filteredInitialRowsData ? filteredInitialRowsData as TowerRowInitialData[] : []
  }
}

// Update row positions based on sorted order and sync any changes with the server
const updateAndSyncRowPositions = async (
  sortedRowData: TowerRowData[], 
  originalRowData: TowerRowData[], 
  supabase: SupabaseClient
) => {
  const updatePromises = sortedRowData.map(async (sortedRow, index) => {
    const originalRow = originalRowData.find(row => row.id === sortedRow.id)
    if (!originalRow) return // If the row doesn't exist in the original data, skip it

    if (sortedRow.position !== index) {
      sortedRow.position = index  // Update the position to the current index

      const { error } = await supabase
        .from('tower_rows')
        .update({ position: index })
        .eq('id', sortedRow.id)
      
      if (error) {
        console.error(`Failed to update position for row with id ${sortedRow.id}`, error)
      }
    }
  })

  await Promise.all(updatePromises)
}

// Update clock positions based on sorted order and sync any changes with the server
const updateAndSyncClockPositions = async (
  sortedClockData: ClockData[], 
  originalClockData: ClockData[], 
  supabase: SupabaseClient
) => {
  const updatePromises = sortedClockData.map(async (sortedClock, index) => {
    const originalClock = originalClockData.find(clock => clock.id === sortedClock.id)
    if (!originalClock) return // If the clock doesn't exist in the original data, skip it

    if (sortedClock.position !== index) {
      sortedClock.position = index  // Update the position to the current index

      const { error } = await supabase
        .from('clocks')
        .update({ position: index })
        .eq('id', sortedClock.id)
      
      if (error) {
        console.error(`Failed to update position for clock with id ${sortedClock.id}`, error)
      }
    }
  })

  await Promise.all(updatePromises)
}

// Get all the colors used by all the clocks in the tower for the color picker
const getUsedColors = (initialData: TowerInitialData): ColorPaletteItem[] => {
  const usedColors: ColorPaletteItem[] = []

  initialData.rows.forEach(row => {
    if (row) {
      row.clocks.forEach(clock => {
        if (clock && isValidHexColor(clock.color)) {
          const colorIndex = usedColors.findIndex(item => item.hex === clock.color)
          if (colorIndex === -1) {
            usedColors.push({ clocksUsing: [clock.id], hex: clock.color })
          } else {
            usedColors[colorIndex].clocksUsing.push(clock.id)
          }
        }
      })
    }
  })
  return usedColors
}
