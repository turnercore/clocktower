import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Input } from "@/components/ui"
import { GiDemolish } from 'react-icons/gi'
import { FaPersonWalkingLuggage } from 'react-icons/fa6'
import { BsGear } from 'react-icons/bs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from '@/types'
// Import other required components

interface TowerSettingsDialogProps {
  towerData: any; // Replace with your tower type
}

const TowerSettingsDialog: React.FC<TowerSettingsDialogProps> = ({ towerData }) => {
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

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isOwner) {
      // Update the name on the server
      // setTowerName to the new name
    }
  }

  const handleLeaveTower = async () => {
    if (isOwner) {
      // Delete the tower
    } else {
      // Leave the tower
    }
  }

  const handleDeleteTower = async () => {

  }

  const handleRemoveUser = async (userId: string) => {
    if (isOwner) {
      // Remove the user from the tower
    }
  }

  const handleAddUser = async (username: string) => {
    if (isOwner) {
      // Add the user to the tower
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
          <label>Tower Name: </label>
          <Input type="text" value={towerName} disabled={!isOwner} onChange={handleNameChange} />
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
              <AlertDialogAction className='vibrating-element bg-red-500' onClick={isOwner ? handleDeleteTower : handleLeaveTower}>
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
