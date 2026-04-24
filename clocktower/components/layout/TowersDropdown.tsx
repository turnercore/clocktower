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
  CommandList,
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
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { GoPlusCircle } from 'react-icons/go'
import insertNewTowerSA from '@/tools/actions/insertNewTowerSA'

const TowersDropdown = ({ user }: { user: User | null }) => {
  const router = useRouter()
  const params = useParams()
  const path = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [towers, setTowers] = useState<TowerDatabaseType[]>([])
  const [selectedTowerName, setSelectedTowerName] = useState('')
  const [userId, setUserId] = useState<UUID | null>(user?.id || null)

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

  // Get the towers for the user
  useEffect(() => {
    if (!userId) return

    const getTowers = async () => {
      // Fetch the towers the user has access to using the join table
      const { data: towerAccessData, error: towerAccessError } = await supabase
        .from('towers_users')
        .select('tower_id')
        .eq('user_id', userId)
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
    getTowers()
  }, [userId, supabase, user])

  // Subscribe to changes in the towers list
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
  }, [userId, supabase])

  // Reset the selected tower name to the current tower name
  useEffect(() => {
    if (!params.id || !towers.length || !path.includes('tower')) {
      setSelectedTowerName('')
      return
    }

    const currentTower = towers.find((tower) => tower.id === params.id)
    if (currentTower) setSelectedTowerName(currentTower.name || '')
  }, [params.id, towers, path])

  const navigateToSelectedTower = (towerId: UUID) => {
    // If the value is not a valid UUID, do nothing
    if (!isValidUUID(towerId)) return
    // Navigate to the tower page
    router.push(`/tower/${towerId}`)
  }

  const handleSelectTower = (tower: TowerDatabaseType) => {
    setSelectedTowerName(tower.name || '')
    setOpen(false)
    navigateToSelectedTower(tower.id)
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
          <CommandList>
            <CommandEmpty>No tower found.</CommandEmpty>
            <CommandGroup>
              {towers.map((tower) => (
                <CommandItem
                  aria-label={`Select ${tower.name}`}
                  key={tower.id}
                  value={tower.id}
                  keywords={[tower.name || '']}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    handleSelectTower(tower)
                  }}
                  onClick={() => {
                    handleSelectTower(tower)
                  }}
                  onSelect={() => {
                    handleSelectTower(tower)
                  }}
                >
                  <GiWhiteTower className='mr-2 h-4 w-4' />
                  <span>{tower.name}</span>
                </CommandItem>
              ))}
              <CommandItem
                key='new'
                value='new-tower'
                keywords={['new', 'tower', 'create']}
                forceMount
                onMouseDown={(event) => {
                  event.preventDefault()
                  handleCreateNewTower()
                }}
                onClick={handleCreateNewTower}
                onSelect={handleCreateNewTower}
              >
                <GoPlusCircle className='mr-2 h-4 w-4' />
                <span>New Tower</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default TowersDropdown
