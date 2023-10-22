'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input, Label } from "@/components/ui"
import { GiDemolish } from 'react-icons/gi'
import { FaPersonWalkingLuggage } from 'react-icons/fa6'
import { BsGear } from 'react-icons/bs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from '@/types'
import { useRouter } from 'next/navigation'
// Import other required components

interface TowerSettingsDialogProps {
  towerData: any; // Replace with your tower type
}

const TowerSettingsDialog: React.FC<TowerSettingsDialogProps> = ({ towerData }) => {
  const router = useRouter()
  const [towerName, setTowerName] = useState(towerData.name)
  const [currentUserId, setCurrentUserId] = useState<UUID | null>(null) // Replace with your user type
  const [isOwner, setIsOwner] = useState<boolean>(false)
  // Get current user
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {data: sessionData, error: sessionError} = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!sessionData?.session?.user?.id) throw new Error("No user id found")
        const userId = sessionData.session.user.id

        setCurrentUserId(userId as UUID)
        if (userId === towerData.owner) {
          setIsOwner(true)
        }
      } catch (error) {
        console.error(error)
      }
    }
    getCurrentUser()
  }, [])

  const handleNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isOwner) {
      const newName = event.target.value
      try {
        // Assume updateTowerName is a function to update the tower name on the server
        const { error } = await supabase.from('towers').update({ name: newName }).eq('id', towerData.id)
        if (error) throw error
        setTowerName(newName)
      } catch (error: any) {
        console.error('Error updating tower name:', error.message || error)
      }
    }
  }

  const handleLeaveTower = async () => {
    try {
      if (isOwner) {
        // Assume deleteTower is a function to delete the tower on the server
        const { error } = await supabase.from('towers').delete().eq('id', towerData.id)
        if (error) throw error
      } else {
        // Assume leaveTower is a function to remove the current user from the tower on the server
        // Remove the user from the users array in the tower
        const newUsersArray = towerData.users.filter((userId: UUID) => userId !== currentUserId)
        const { error:usersArrayError } = await supabase.from('towers').update({ users: newUsersArray }).eq('id', towerData.id)
        if (usersArrayError) throw usersArrayError
        const { error:towersUsersError } = await supabase.from('towers_users').delete().eq('tower_id', towerData.id).eq('user_id', currentUserId)
        if (towersUsersError) throw towersUsersError
      }
      // Redirect to the home page
      router.push('/')
    } catch (error: any) {
      console.error('Error leaving/deleting tower:', error.message || error)
    }
  }

  const handleAddUser = async (userId: UUID) => {
    if (isOwner) {
      try {
        // Add userId to the users array
        const newUsersArray = [...towerData.users, userId]
        const { error:updateUsersArrayError } = await supabase.from('towers').update({ users: newUsersArray }).eq('id', towerData.id)
        if (updateUsersArrayError) throw updateUsersArrayError
        // Assume addUser is a function to add a user to the tower on the server
        const { error } = await supabase.from('towers_users').upsert({ tower_id: towerData.id, user_id: userId });
        if (error) throw error;
      } catch (error: any) {
        console.error('Error adding user:', error.message || error);
      }
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
      <Button title="Tower Settings" variant={'ghost'} className="ml-2">
          <BsGear className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tower Settings</DialogTitle>
        </DialogHeader>
        <div className='flex flex-row space-y-2 items-center'>
          <Label htmlFor="name">Tower Name: </Label>
          <Input defaultValue={towerName} disabled={!isOwner} onBlur={handleNameChange} />
        </div>
          <AlertDialog>
          <AlertDialogTrigger asChild>
          {isOwner ? (<Button variant='destructive' className='w-1/2 text-center'><GiDemolish className='w-full h-full'/></Button>)
          : (<Button variant='destructive' className='w-1/2 text-center'>Leave</Button>)}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isOwner ? 'Demolish Tower?' : 'Leave Tower?'}</AlertDialogTitle>
              <AlertDialogDescription>
                { isOwner ? "Are you sure? If so let's burn this sucker to the ground 🔥." : "Are you sure you want to leave? You'll have to be invited back." }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className='vibrating-element bg-red-500' onClick={handleLeaveTower}>
                { isOwner ? <GiDemolish className='w-full h-full'/>  : <FaPersonWalkingLuggage className='w-full h-full' /> }
                  </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
          {/* Loop through users and display avatars */}
          {/* Add AlertDialog for removing users if isOwner is true */}
        {isOwner && (
          <Button onClick={() => {/* Open dialog to add a user */}}>
            Add User
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default TowerSettingsDialog
