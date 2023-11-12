'use client'
import { useEffect, useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { isValidUUID } from '@/tools/isValidUUID'
import { TowerDatabaseType, UUID } from '@/types/schemas'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { GiWhiteTower } from 'react-icons/gi'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GoPlusCircle } from 'react-icons/go'
import insertNewTowerSA from '@/tools/actions/insertNewTowerSA'
import { Database } from '@/types/supabase'
import { capitalizeFirstLetterOfEveryWord } from '@/tools/capitalizeFirstLetterOfEveryWord'

const TowersDropdown = () => {
  const router = useRouter()
  const params = useParams()
  const path = usePathname()
  const supabase = createClientComponentClient<Database>()
  const [open, setOpen] = useState(false)
  const [towers, setTowers] = useState<TowerDatabaseType[]>([])
  const [selectedTowerName, setSelectedTowerName] = useState('')
  const [userId, setUserId] = useState<UUID | null>(null)

  // Handle realtime changes to the towers list if a tower is addded
  const handleRealtimeInsertTower = async (payload: any) => {
    // Check if the tower is already in the list, if it is ignore
    if (towers.find((tower) => tower.id === payload.new.id)) return

    // Get tower data from ID
    const { data, error } = await supabase
      .from('towers')
      .select('*')
      .eq('id', payload.new.tower_id)
      .single()
    // Handle errors
    if (error) {
      console.error(error)
      return
    }

    // Get the tower data
    const newTower = data
    // Add the tower to the list
    const newTowerList = [...towers, newTower]
    // Update the list
    //@ts-ignore TODO: Fix this
    setTowers(newTowerList)
  }

  // Handle realtime changes to the towers list if a tower is deleted
  const handleRealtimeDeleteTower = (payload: any) => {
    const towerId = payload.old.tower_id
    // Remove the tower from the list
    const newTowersList = towers.filter((tower) => tower.id !== towerId)
    setTowers(newTowersList)
    // If the user is on the tower page, redirect to the home page
    if (path.includes(towerId)) router.push('/')
  }

  // Handle creating a new tower
  const handleCreateNewTower = async () => {
    const newTowerId = crypto.randomUUID()
    setOpen(false)
    const { error } = await insertNewTowerSA(newTowerId)
    if (error) {
      console.error(error)
      return
    }
    router.push(`/tower/${newTowerId}`)
  }

  // Getting the towers from the database the user has access to
  useEffect(() => {
    const getTowers = async () => {
      // Get the user's id
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      // Handle errors
      if (sessionError || !sessionData || !sessionData.session?.user.id) {
        console.error(sessionError)
        return
      }

      const currentUserId = sessionData.session.user.id
      setUserId(currentUserId)

      // Fetch the towers the user has access to using the join table
      const { data: towerAccessData, error: towerAccessError } = await supabase
        .from('towers_users')
        .select('tower_id')
        .eq('user_id', currentUserId)
      // Handle errors
      if (towerAccessError) {
        console.error(towerAccessError)
        return
      }
      // Get the tower ids from the join table
      const towerIds = towerAccessData?.map((tower) => tower.tower_id) || []
      // Fetch the towers from the tower ids
      const { data: towersData, error: towersError } = await supabase
        .from('towers')
        .select('*')
        .in('id', towerIds)
      // Handle errors
      if (towersError) {
        console.error(towersError)
        return
      }

      // Set the towers
      setTowers(towersData as TowerDatabaseType[])
      // Set the current tower name
      const currentTower = towersData.find((tower) => tower.id === params.id)
      if (currentTower) setSelectedTowerName(currentTower.name || '')
    }

    const subscribeToChanges = async () => {
      console.log('Subscribing to changes')
    }

    getTowers()
  }, [])

  // Subscribe to changes once we have a userID
  useEffect(() => {
    if (!userId) return
    // Subscribe to changes
    const channel = supabase
      .channel(`towers_users_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'towers_users',
          filter: `user_id=eq.${userId}`,
        },
        handleRealtimeInsertTower,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'towers_users',
          filter: `user_id=eq.${userId}`,
        },
        handleRealtimeDeleteTower,
      )
      .subscribe()

    // Unsubscribe on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const navigateToSelectedTower = (towerId: UUID) => {
    // If the value is not a valid UUID, do nothing
    if (!isValidUUID(towerId)) return
    // Navigate to the tower page
    router.push(`/tower/${towerId}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[200px] justify-between'
        >
          {selectedTowerName ? selectedTowerName : 'Select tower...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command>
          <CommandInput placeholder='Search Towers...' />

          <CommandEmpty>
            No tower found. Perhaps you should <br />
            <Button>Create a new one.</Button>
          </CommandEmpty>
          <CommandGroup>
            {towers.map((tower) => (
              <CommandItem
                key={tower.id}
                onSelect={(currentValue) => {
                  if (currentValue === selectedTowerName) return
                  setSelectedTowerName(
                    capitalizeFirstLetterOfEveryWord(currentValue),
                  )
                  setOpen(false)
                  navigateToSelectedTower(tower.id)
                }}
              >
                <GiWhiteTower className='mr-2 h-4 w-4' />
                {tower.name}
              </CommandItem>
            ))}
            <CommandItem key='new' onSelect={handleCreateNewTower}>
              <GoPlusCircle className='mr-2 h-4 w-4' />
              <p>New Tower</p>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default TowersDropdown
