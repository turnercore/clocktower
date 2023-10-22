'use client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, usePathname } from 'next/navigation'
import { TbUserShare } from 'react-icons/tb'

export default function ShareTowerPopover() {
  const path = usePathname()
  const params = useParams<{ id: string }>()
  const towerId = params.id
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (path.includes('tower') && towerId) {
      setIsOnTowerPage(true)
    } else return

    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session?.user.id) {
        setUserId(data.session.user.id)
      }
    }
    fetchUserId()
  }, [towerId, path])

  const handleInvite = async () => {
    if (!username) return
    setIsLoading(true)
  
    try {
      // Check if the user with the entered username exists
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
      
      // Error handling
      if (profilesError || !profilesData) throw profilesError || new Error("Error fetching profiles data")
  
      if (profilesData && profilesData.length > 0) {
        const invitedUserId = profilesData[0].id
        
        // Get current users arrays from tower, clocks, and tower_rows
        const { data: towerData, error: towerError } = await supabase
          .from('towers')
          .select('users, id')
          .eq('id', towerId)
        if (towerError || !towerData) throw towerError || new Error("Error fetching tower data")
  
        const { data: clocksData, error: clocksError } = await supabase
          .from('clocks')
          .select('users, id')
          .eq('tower_id', towerId)
        if (clocksError || !clocksData) throw clocksError || new Error("Error fetching clocks data")
  
        const { data: towerRowsData, error: towerRowsError } = await supabase
          .from('tower_rows')
          .select('users, id')
          .eq('tower_id', towerId)
        if (towerRowsError || !towerRowsData) throw towerRowsError || new Error("Error fetching tower rows data")
  
        // Function to update users array if the invitedUserId is not already present
        const updateUserArray = async (table: string, recordId: string, usersArray: string[]) => {
          if (!usersArray.includes(invitedUserId)) {
            const updatedUsersArray = [...usersArray, invitedUserId]
            await supabase
              .from(table)
              .update({ users: updatedUsersArray })
              .eq('id', recordId)
          }
        }
  
        // Update the users array on the current tower
        await updateUserArray('towers', towerId, towerData[0].users)
  
        // Update the users array on all rows and clocks related to the current tower
        for (const row of towerRowsData) {
          await updateUserArray('tower_rows', row.id, row.users)
        }
        for (const clock of clocksData) {
          await updateUserArray('clocks', clock.id, clock.users)
        }
  
        // Add entry in towers_users
        await supabase
          .from('towers_users')
          .insert([{ tower_id: towerId, user_id: invitedUserId }])
  
        // Add entry in the friends table
        await supabase
          .from('friends')
          .upsert([{ user_id: userId, friend_id: invitedUserId }])
      }
    } catch (error) {
      console.error(error)
    }
    setIsLoading(false)
  }
  
  return (
    ( isOnTowerPage && userId ) && (
    <Popover>
      <PopoverTrigger asChild>
        <Button title="Invite Users" variant={'ghost'} className="ml-2">
          <TbUserShare className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Invite User</h4>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-2 h-8"
              />
            </div>
            <Button onClick={handleInvite}>Invite</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ) )
}
