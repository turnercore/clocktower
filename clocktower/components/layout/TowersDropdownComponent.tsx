'use client'
import * as React from 'react'
import { useEffect } from 'react'
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
import { isValidUUID } from '@/lib/tools/isValidUUID'
import { UUID } from '@/types'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { GiWhiteTower } from 'react-icons/gi'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function TowersDropdownComponent({
  initialTowers,
  userId,
}: {
  initialTowers: any[]
  userId: UUID | null
}) {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()
  const path = usePathname()
  const [open, setOpen] = React.useState(false)
  const [towers, setTowers] = React.useState(initialTowers)
  const selectedTowerName =
    towers.find((tower) => tower.id === params.id)?.name || ''
  const [value, setValue] = React.useState(selectedTowerName)

  const handleInsertTower = async (payload: any) => {
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
    setTowers(newTowerList)
  }

  const handleDeleteTower = (payload: any) => {
    console.log('tower was deleted')
    console.log(payload)
    const towerId = payload.old.tower_id
    // Remove the tower from the list
    const newTowersList = towers.filter((tower) => tower.id !== towerId)
    setTowers(newTowersList)
    // If the user is on the tower page, redirect to the home page
    if (path.includes(towerId)) router.push('/')
  }

  useEffect(() => {
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
        handleInsertTower,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'towers_users',
          filter: `user_id=eq.${userId}`,
        },
        handleDeleteTower,
      )
      .subscribe()

    // Unsubscribe on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleInsertTower, handleDeleteTower, userId])

  const navigateToSelectedTower = (towerId: UUID) => {
    // If the value is not a valid UUID, do nothing
    if (!isValidUUID(towerId)) return
    // Navigate to the tower page
    router.push(`/tower/${towerId}`)
  }

  const towerNames = towers.map((tower) => tower.name)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-[200px] justify-between'
        >
          {value ? value : 'Select tower...'}
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
                  if (currentValue === value) return
                  setValue(capitalizeFirstLetter(currentValue))
                  setOpen(false)
                  navigateToSelectedTower(tower.id)
                }}
              >
                <GiWhiteTower className='mr-2 h-4 w-4' />
                {tower.name}
              </CommandItem>
            ))}
            <CommandItem
              key='new'
              onSelect={() => {
                setOpen(false)
                router.push('/tower/new')
              }}
              className='p-1 pt-5'
            >
              <Button className='mx-auto items-center'> + New Tower </Button>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Capitilize the first letter of every word in a string
function capitalizeFirstLetter(string: string) {
  return string
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
