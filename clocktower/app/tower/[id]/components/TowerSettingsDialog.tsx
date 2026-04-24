'use client'
import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
  Label,
  toast,
  Switch,
} from '@/components/ui'
import { GiDemolish } from 'react-icons/gi'
import { FaPersonWalkingLuggage } from 'react-icons/fa6'
import { BsGear } from 'react-icons/bs'
import { createClient } from '@/lib/supabase/client'
import { TowerDatabaseType } from '@/types/schemas'
import { useRouter } from 'next/navigation'
import toggleTowerLockSA from '../actions/toggleTowerLockSA'
import useEditAccess from '@/hooks/useEditAccess'
import { useTowerAccess } from './TowerAccessContext'
import toggleTowerClockLockSA from '../actions/toggleTowerClockLockSA'
// Import other required components

interface TowerSettingsDialogProps {
  towerData: TowerDatabaseType
}

const TowerSettingsDialog: React.FC<TowerSettingsDialogProps> = ({
  towerData,
}) => {
  const router = useRouter()
  const [towerName, setTowerName] = useState(towerData.name)
  const [isOpen, setIsOpen] = useState(false)
  const [isTowerLocked, setIsTowerLocked] = useState(towerData.is_locked)
  const [areClocksLocked, setAreClocksLocked] = useState(
    towerData.clocks_locked,
  )
  const hasEditAccess = useEditAccess(towerData.id)
  const { currentUserId, isOwner } = useTowerAccess()
  const supabase = createClient()

  useEffect(() => {
    setTowerName(towerData.name)
    setIsTowerLocked(towerData.is_locked || false)
    setAreClocksLocked(towerData.clocks_locked)
  }, [towerData])

  const handleNameChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (isOwner) {
      const newName = event.target.value
      // Make sure name is less than 30 characters
      if (newName.length > 30) {
        return toast({
          variant: 'destructive',
          title: 'Name too long.',
          description: 'Tower name must be less than 30 characters.',
        })
      }
      try {
        // Assume updateTowerName is a function to update the tower name on the server
        const { error } = await supabase
          .from('towers')
          .update({ name: newName })
          .eq('id', towerData.id)
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
        const { error } = await supabase
          .from('towers')
          .delete()
          .eq('id', towerData.id)
        if (error) throw error
      } else {
        if (!currentUserId) throw new Error('No current user id found')
        // Call the remove_user_from_tower function via the rpc method
        const { error } = await supabase.rpc('remove_user_from_tower', {
          tower: towerData.id,
          userid: currentUserId,
        })
        // Check for errors
        if (error) throw error
      }
      // Redirect to the home page
      router.push('/')
    } catch (error: any) {
      console.error('Error leaving/deleting tower:', error.message || error)
    }
  }

  const handleTowerLockSwitch = async () => {
    if (!isOwner) return
    // set the public state
    const oldIsTowerLocked = isTowerLocked
    setIsTowerLocked(!isTowerLocked)

    // Call server action
    const { error } = await toggleTowerLockSA({ towerId: towerData.id })
    if (error) {
      console.error(error)
      toast({
        title: 'Error changing locked status on tower.',
        description: error,
        variant: 'destructive',
      })
      setIsTowerLocked(oldIsTowerLocked)
      return
    }
  }

  const handleClockLockSwitch = async () => {
    if (!isOwner) return

    const oldAreClocksLocked = areClocksLocked
    setAreClocksLocked(!areClocksLocked)

    const { error } = await toggleTowerClockLockSA({ towerId: towerData.id })
    if (error) {
      console.error(error)
      toast({
        title: 'Error changing clock lock status.',
        description: error,
        variant: 'destructive',
      })
      setAreClocksLocked(oldAreClocksLocked)
    }
  }

  if (!isOwner && !hasEditAccess) return <></>

  // Change this to be a form with validation!
  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <Button
          id='destroy-tower-button'
          title='Tower Settings'
          variant={'ghost'}
          className='ml-2'
          onClick={() => setIsOpen(!isOpen)}
        >
          <BsGear className='h-5 w-5' />
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
        onPointerDownOutside={() => setIsOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>Tower Settings</DialogTitle>
        </DialogHeader>
        <div className='flex flex-row space-x-4 items-center'>
          <Label htmlFor='tower-name'>Name</Label>
          <Input
            id='tower-name'
            defaultValue={towerName}
            disabled={!isOwner}
            onBlur={handleNameChange}
          />
        </div>
        {isOwner && (
          <>
            <div className='flex flex-row space-x-4 items-center'>
              <Label htmlFor='toggle-tower-lock'>User Editing</Label>
              <Switch
                id='toggle-tower-lock'
                checked={!isTowerLocked}
                onClick={handleTowerLockSwitch}
              />
            </div>
            <div className='flex flex-row space-x-4 items-center'>
              <Label htmlFor='toggle-clock-lock'>Lock Clocks</Label>
              <Switch
                id='toggle-clock-lock'
                checked={areClocksLocked}
                onClick={handleClockLockSwitch}
              />
            </div>
          </>
        )}
        <DialogFooter className='items-center gap-2 pt-4'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              {isOwner ? (
                <Button variant='destructive'>
                  <GiDemolish className='w-full h-full' />
                </Button>
              ) : (
                <Button variant='destructive'>Leave</Button>
              )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isOwner ? 'Demolish Tower?' : 'Leave Tower?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isOwner
                    ? "Are you sure? If so let's burn this sucker to the ground 🔥."
                    : "Are you sure you want to leave? You'll have to be invited back."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className='vibrating-element bg-red-500'
                  onClick={handleLeaveTower}
                >
                  {isOwner ? (
                    <GiDemolish className='w-full h-full' />
                  ) : (
                    <FaPersonWalkingLuggage className='w-full h-full' />
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type='submit' onClick={() => setIsOpen(false)}>
            Save
          </Button>
        </DialogFooter>
        {/* Loop through users and display avatars */}
      </DialogContent>
    </Dialog>
  )
}

export default TowerSettingsDialog
