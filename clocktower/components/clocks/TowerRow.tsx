'use client'
import React, { useState, useEffect } from 'react'
import Clock from './Clock'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button, Card, CardContent, CardTitle, Input, ScrollArea, ScrollBar, toast } from '@/components/ui'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from 'crypto'
import { sanitizeString } from '@/tools/sanitizeStrings'
import { TbClockPlus } from 'react-icons/tb'
import type { ClockData, ColorPaletteItem, TowerRowData, TowerRowInitialData} from '@/types'
import { TbHttpDelete } from 'react-icons/tb'
import { TiDelete } from 'react-icons/ti'

interface TowerRowProps {
  initialData: TowerRowInitialData
  initialUsedColors: ColorPaletteItem[]
  rowId: UUID
  towerId: UUID
  users: UUID[]
  onRowDelete: (rowId: UUID) => void
}

const TowerRow: React.FC<TowerRowProps> = ({ initialData, initialUsedColors, towerId, users, onRowDelete }) => {
  const rowId = initialData.id
  const [clocks, setClocks] = useState<ClockData[]>(initialData.clocks)
  const [rowName, setRowName] = useState<string>(initialData.name || '')
  const supabase = createClientComponentClient()

  // Update self when a server payload is received
  const handleTowerRowPayload = (payload: any) => {
    console.log('Received payload event:', payload)
    const eventType = payload.eventType
    const data = payload.new
    if( data.id !== rowId) return 

    switch (eventType) {
      case 'UPDATE':
        // Handle Row Name Change
        if(data.name !== rowName) {
         setRowName(data.name)
        }
        break
      case 'DELETE':
        onRowDelete(rowId)
        break
      default:
        console.error('not valid eventType on payload')
    }
  }

  // If server adds a clock, add it to the local state
  const handleClockAdds = (payload: any) => {
    const data = payload.new
    if(data.row_id !== rowId) return
    const newClocks = [...clocks, data]
    setClocks(sortClocks(newClocks))
  }

  useEffect(() => {
    const subscription = supabase
    .channel(`tower_row_${rowId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tower_rows', filter:`id=eq.${rowId}`}, handleTowerRowPayload)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clocks', filter:`row_id=eq.${rowId}`}, handleClockAdds)
    .subscribe()

  
    // Cleanup function to unsubscribe from real-time updates
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])
  
  const sortClocks = (clocks: ClockData[]) => {
    const sortedClocks = [...clocks].sort((a, b) => a.position - b.position)
    return sortedClocks
  }

  const addClock = async () => {
    const newClock: ClockData = {
      id: crypto.randomUUID() as UUID,
      position: clocks.length,
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
    const oldClockData = clocks ? [...clocks] : []
    const updatedClocks = clocks ? [...clocks, newClock] : [newClock]
    setClocks(updatedClocks)
    // Update the server
    const { error } = await supabase.from('clocks').insert(newClock)
    // Handle Errors
    if (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error adding new clock",
        description: error.message,
      })
      // Revert if error
      setClocks(oldClockData)
      return
    }
  }

  // Update the Row's name on the server and local states
  const handleRowNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get old row name
    const oldRowName = rowName
    const newRowName = sanitizeString(event.target.value);
    // Update local state
    setRowName(event.target.value);
    // Update the server
    const { error, data } = await supabase.from('tower_rows').update({ name: newRowName }).eq('id', rowId).single()
    // Handle Errors
    if (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error updating row name",
        description: error.message,
      })
      // Revert if error
      setRowName(oldRowName)
    }
  }

  // Update the server and delete the row
  const handleRowDelete = async () => {
    // Delete from the server
    const { error } = await supabase.from('tower_rows').delete().eq('id', rowId).single()
    if (error) {
      console.error(error)
      return
    }
    // Delete local state and update the tower
    onRowDelete(rowId)
  }

  // Update local and server state when a clock is deleted tower_row.clocks should be updated
  const handleClockDelete = async (clockId: UUID, skipServerUpdate = false) => {
        const updatedClocks = clocks.filter((clock) => clock.id !== clockId)
        // Update the local state by removing the clock
        setClocks(sortClocks(updatedClocks))
  }



  return (
    <Card className='flex flex-col space-y-2 mr-10 ml-2'>
      {/* Row Name and Settings*/}
      <CardTitle className='flex flex-row space-x-2 space-y-2 items-center mx-8 mt-3'>
        <Input 
          className='w-[200px] mt-2'
          placeholder="Row" 
          defaultValue={rowName} 
          onBlur={handleRowNameChange} />
      <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline' ><TiDelete className='w-full h-full' /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Row{rowName ? " " + rowName : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the row and all clocks contained within.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className='vibrating-element bg-red-500' onClick={handleRowDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
      </CardTitle>
      {/* Clocks */}
      <CardContent>
      <ScrollArea className='overflow-auto'>
        <div className='flex flex-row width-full items-center space-x-4'>
        {clocks && clocks.length > 0 && clocks.map((clock) => (
          <div key={clock.id} className='min-w-[150px]'>
            <Clock initialData={clock} initialUsedColors={initialUsedColors} key={clock.id} towerId={towerId} rowId={rowId} onDelete={handleClockDelete}/>
          </div>
        ))}
        <Button variant='ghost'className='h-24 w-24' onClick={addClock}><TbClockPlus className='ml-1 h-8 w-8'/></Button>
        </div>
        <ScrollBar orientation='horizontal' className='w-full' />
        </ScrollArea> 
      </CardContent>
    </Card>
  )
}


export default React.memo(TowerRow)
