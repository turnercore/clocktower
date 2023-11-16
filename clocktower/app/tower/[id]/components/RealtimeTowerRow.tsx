'use client'
import React, { useState, useEffect, Suspense } from 'react'
import RealtimeClock from './RealtimeClock'
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
  Card,
  CardContent,
  CardTitle,
  Input,
  ScrollArea,
  ScrollBar,
  toast,
} from '@/components/ui'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { TbClockPlus } from 'react-icons/tb'
import { UUID, ClockType, TowerRowRow } from '@/types/schemas'
import { TiDelete } from 'react-icons/ti'
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import insertNewClockSA from '../actions/insertNewClockSA'
import { updateRowNameSA } from '../actions/updateRowNameSA'
import { deleteTowerRowSA } from '../actions/deleteTowerRowSA'
import useEditAccess from '@/hooks/useEditAccess'

type RealtimeTowerRowProps = {
  initialData: TowerRowRow
  children?: React.ReactNode
}

const RealtimeTowerRow: React.FC<RealtimeTowerRowProps> = ({
  initialData,
  children,
}) => {
  const rowId = initialData.id
  const towerId = initialData.tower_id
  const [rowData, setRowData] = useState<TowerRowRow>(initialData)
  const [rowName, setRowName] = useState<string>(initialData.name || '')
  const [isDeleted, setIsDeleted] = useState<boolean>(false)
  const [addedClocks, setAddedClocks] = useState<Array<ClockType>>([])
  const addedClocksRef = React.useRef<UUID[]>(addedClocks.map((c) => c.id))
  const hasEditAccess = useEditAccess(towerId)
  const supabase = createClientComponentClient()

  // Update self when a server payload is received
  const handleRealtimeTowerRowUpdate = (
    payload: RealtimePostgresUpdatePayload<TowerRowRow>,
  ) => {
    const eventType = payload.eventType
    if (eventType !== 'UPDATE') return
    const newData = payload.new
    // Make sure it pertains to this row
    if (newData.id !== rowId) return

    if (newData.name !== rowName) {
      setRowName(newData.name || '')
    }
  }

  const handleRealtimeTowerRowDelete = (
    payload: RealtimePostgresDeletePayload<TowerRowRow>,
  ) => {
    if (isDeleted) return
    const eventType = payload.eventType
    if (eventType !== 'DELETE') return
    const oldData = payload.old
    // Make sure it pertains to this row
    if (oldData.id !== rowId) return

    // Delete local state and update the tower
    setIsDeleted(true)
  }

  const handleRealtimeClockInsert = (
    payload: RealtimePostgresInsertPayload<ClockType>,
  ) => {
    if (isDeleted) return
    const eventType = payload.eventType
    if (eventType !== 'INSERT') return
    const newData = payload.new
    // Make sure it pertains to this row
    if (newData.row_id !== rowId) return

    // Ensure the clock is not already in the addedClocksRef
    if (addedClocksRef.current.includes(newData.id)) return

    // Add the clock locally
    setAddedClocks((prevClocks) => {
      const updatedClocks = [...prevClocks, newData]
      // Update the ref inside the setState callback
      addedClocksRef.current = updatedClocks.map((c) => c.id)
      return updatedClocks
    })
  }

  useEffect(() => {
    const subscription = supabase
      .channel(`tower_row_${rowId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tower_rows',
          filter: `id=eq.${rowId}`,
        },
        handleRealtimeTowerRowUpdate,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tower_rows',
          filter: `id=eq.${rowId}`,
        },
        handleRealtimeTowerRowDelete,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clocks',
          filter: `row_id=eq.${rowId}`,
        },
        handleRealtimeClockInsert,
      )
      .subscribe()

    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, rowId])

  const addClock = async () => {
    // Define default Clock
    const newClock: ClockType = {
      id: crypto.randomUUID() as UUID,
      position: 420 + addedClocksRef.current.length,
      name: '',
      segments: 6,
      row_id: rowId,
      tower_id: towerId,
      users: rowData.users || [],
      filled: null,
      rounded: false,
      line_width: 20,
      lighten_intensity: 0.35,
      darken_intensity: 0.5,
      color: '#E38627', // Default color, this should probably be a const or random from a palette
    }

    // Update local state
    const oldClocks = addedClocks
    setAddedClocks((prevClocks) => {
      const updatedClocks = [...prevClocks, newClock]
      // Update the ref inside the setState callback
      addedClocksRef.current = updatedClocks.map((clock) => clock.id)
      return updatedClocks
    })

    // Update the server
    const { error } = await insertNewClockSA(newClock)

    if (error) {
      console.error('Error adding clock:', error)
      // If there was an error, revert the state
      setAddedClocks(() => {
        // Update the ref inside the setState callback
        addedClocksRef.current = oldClocks.map((clock) => clock.id)
        return oldClocks
      })
    }
  }

  // Update the Row's name on the server and local states
  const handleRowNameChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newRowName = event.target.value
    // Make sure newRowName is less than 30 characters
    if (newRowName.length > 30) {
      setRowName('')
      toast({
        variant: 'destructive',
        title: 'Error updating row name',
        description: 'Row name must be less than 30 characters.',
      })
      return
    }
    // Get old row name
    const oldRowName = rowName
    // Update local state
    setRowName(event.target.value)
    // Update the server
    const { error } = await updateRowNameSA(rowId, newRowName)
    // Handle Errors
    if (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error updating row name',
        description: error,
      })
      // Revert if error
      setRowName(oldRowName)
    }
  }

  // Update the server and delete the row
  const handleRowDelete = async () => {
    // Update local state
    setIsDeleted(true)
    // Delete from the server
    const { error } = await deleteTowerRowSA({ rowId, towerId })
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting row',
        description: error,
      })
      setIsDeleted(false)
      return
    }
  }

  return (
    <Suspense>
      {!isDeleted && (
        <Card className='flex flex-col space-y-2 mr-10 ml-2'>
          {/* Row Name and Settings*/}
          <CardTitle className='flex flex-row space-x-2 space-y-2 items-center mx-8 mt-3'>
            {hasEditAccess ? (
              <Input
                name='rowName'
                className='w-[200px] mt-2'
                placeholder='Row'
                defaultValue={rowName}
                onBlur={handleRowNameChange}
              />
            ) : (
              <p>{rowName}</p>
            )}
            {hasEditAccess && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='outline'>
                    <TiDelete className='w-full h-full' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Row{rowName ? ' ' + rowName : ''}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the row and all clocks contained within.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className='vibrating-element bg-red-500'
                      onClick={handleRowDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardTitle>
          <CardContent>
            <ScrollArea className='overflow-auto'>
              <div className='flex flex-row width-full items-center space-x-6'>
                {children}
                {addedClocks.map((clock) => (
                  <RealtimeClock key={clock.id} initialData={clock} />
                ))}
                {hasEditAccess && (
                  <Button
                    variant='ghost'
                    className='h-24 w-24'
                    onClick={addClock}
                  >
                    <TbClockPlus className='ml-1 h-8 w-8' />
                  </Button>
                )}
              </div>
              <ScrollBar orientation='horizontal' className='w-full' />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </Suspense>
  )
}

export default RealtimeTowerRow
