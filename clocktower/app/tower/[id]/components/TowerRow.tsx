'use client'
import React, { useState, useEffect, useRef } from 'react'
import Clock from './Clock'
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
import {
  UUID,
  ClockType,
  TowerRowType,
  TowerRowRow,
  ClockRowData,
  UUIDSchema,
  ColorPaletteType,
} from '@/types/schemas'
import { TiDelete } from 'react-icons/ti'
import {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import insertNewClock from '../actions/insertNewClock'
import updateRowNameServerAction from '../actions/updateRowNameServerAction'
import deleteTowerRow from '../actions/deleteTowerRow'

type TowerRowProps = {
  initialData: TowerRowType
  colorPalette: ColorPaletteType
  rowId: UUID
  towerId: UUID
  users: UUID[]
  onDelete: (rowId: UUID) => void
}

const TowerRow: React.FC<TowerRowProps> = ({
  initialData,
  colorPalette,
  towerId,
  users,
  onDelete,
}) => {
  const rowId = initialData.id as UUID
  const [clocks, setClocks] = useState<ClockType[]>(initialData.clocks || [])
  const [rowName, setRowName] = useState<string>(initialData.name || '')
  const [colorPaletteValues, setColorPaletteValues] =
    useState<ColorPaletteType>(colorPalette || {})
  const supabase = createClientComponentClient()
  const addedClockIds = useRef<Set<UUID>>(new Set())

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
    const eventType = payload.eventType
    if (eventType !== 'DELETE') return
    const oldData = payload.old
    // Make sure it pertains to this row
    if (oldData.id !== rowId) return

    // Delete local state and update the tower
    onDelete(rowId)
  }

  const handleRealtimeClockInsert = (
    payload: RealtimePostgresInsertPayload<ClockRowData>,
  ) => {
    const newData = payload.new
    // Parse the UUID from the payload
    const parsePayload = UUIDSchema.safeParse(newData.id)
    // Handle errors
    if (!parsePayload.success) return parsePayload.error
    // Get the UUID
    const uuid = parsePayload.data as UUID

    // Make sure it pertains to this row
    if (newData.tower_id !== towerId) return
    if (newData.row_id !== rowId) return
    // Check if the clock ID is in the ref before adding it to the local state
    if (!addedClockIds.current.has(uuid)) {
      setClocks((prevClocks) => {
        const newClocks = [...prevClocks, newData]
        return newClocks
      })
      addedClockIds.current.add(uuid)
    }
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
    const newClock: ClockType = {
      id: crypto.randomUUID() as UUID,
      position: clocks.length || 0,
      name: '',
      segments: 6,
      row_id: rowId,
      tower_id: towerId,
      users,
      filled: null,
      rounded: false,
      line_width: 20,
      lighten_intensity: 0.35,
      darken_intensity: 0.5,
      color: '#E38627', // Default color
    }

    // Update local state
    const oldClockData = clocks ? [...clocks] : []
    const updatedClocks = clocks ? [...clocks, newClock] : [newClock]
    setClocks(updatedClocks)
    addedClockIds.current.add(newClock.id as UUID)
    // Update the server
    const { error } = await insertNewClock(newClock)
    // Handle Errors
    if (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error adding new clock',
        description: error,
      })
      // Revert if error
      setClocks(oldClockData)
      return
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
    const { error } = await updateRowNameServerAction(rowId, newRowName)
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
    // Delete from the server
    const { error } = await deleteTowerRow(rowId)
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting row',
        description: error,
      })
      return
    }
    // Delete local state and update the tower
    onDelete(rowId)
  }

  // Update local and server state when a clock is deleted tower_row.clocks should be updated
  const handleClockDelete = (clockId: UUID) => {
    const updatedClocks = clocks.filter((clock) => clock.id !== clockId)
    // Update the local state by removing the clock
    setClocks(updatedClocks)
  }

  return (
    <Card className='flex flex-col space-y-2 mr-10 ml-2'>
      {/* Row Name and Settings*/}
      <CardTitle className='flex flex-row space-x-2 space-y-2 items-center mx-8 mt-3'>
        <Input
          id='rowName'
          name='rowName'
          className='w-[200px] mt-2'
          placeholder='Row'
          defaultValue={rowName}
          onBlur={handleRowNameChange}
        />
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
      </CardTitle>
      {/* Clocks */}
      <CardContent>
        <ScrollArea className='overflow-auto'>
          <div className='flex flex-row width-full items-center space-x-4'>
            {clocks &&
              clocks.length > 0 &&
              clocks.map((clock) => (
                <div key={clock.id} className='min-w-[150px] flex flex-col'>
                  <Clock
                    initialData={clock}
                    colorPalette={colorPaletteValues}
                    key={clock.id}
                    towerId={towerId}
                    onDelete={handleClockDelete}
                  />
                </div>
              ))}
            <Button variant='ghost' className='h-24 w-24' onClick={addClock}>
              <TbClockPlus className='ml-1 h-8 w-8' />
            </Button>
          </div>
          <br />
          <ScrollBar orientation='horizontal' className='w-full' />
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default React.memo(TowerRow)
