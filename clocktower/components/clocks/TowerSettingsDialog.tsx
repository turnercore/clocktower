'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input, Label, toast } from "@/components/ui"
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
      // Make sure name is less than 30 characters
      if (newName.length > 30) {
        return toast({
          variant: 'destructive',
          title: 'Name too long.',
          description: 'Tower name must be less than 30 characters.'
        })
      }
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

  // Handle the user leaving the tower, if they are the owner then burn it down behind them.
  const handleLeaveTower = async () => {
    try {
      // Check if the user is the owner of the tower
      if (isOwner) {
        // Assume deleteTower is a function to delete the tower on the server
        const { error } = await supabase.from('towers').delete().eq('id', towerData.id);
        if (error) throw error;
      } else {
        // Call the remove_user_from_tower function via the rpc method
        const { data, error } = await supabase.rpc('remove_user_from_tower', {
          tower: towerData.id,
          userid: currentUserId,
        });
        // Check for errors
        if (error) throw error;
        // Optionally, check the result for any additional information
        if (data && data.success !== true) {
          throw new Error('Failed to remove user from tower');
        }
      }
      // Redirect to the home page
      router.push('/');
    } catch (error: any) {
      console.error('Error leaving/deleting tower:', error.message || error);
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
      </DialogContent>
    </Dialog>
  )
}

export default TowerSettingsDialog
