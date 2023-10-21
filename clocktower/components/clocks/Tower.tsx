'use client'
import type{ TowerData, UUID, TowerRowInitialData, TowerInitialData, TowerRowData } from '@/types'
import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TowerRow from './TowerRow'
import { Button, toast } from '@/components/ui'

interface TowerProps {
  initialData: TowerInitialData
  initialUsedColors: string[]
  towerId: UUID
}

const Tower: React.FC<TowerProps> = ({initialData, initialUsedColors, towerId }) => {
 // Initialize state variables with initialData
 const [towerData, setTowerData] = useState<TowerData>(initialData)
 const [rows, setRows] = useState<TowerRowInitialData[]>(initialData.rows)
 const supabase = createClientComponentClient()
 
  // Functions to handle data changes from the server
  const handleInsertRow = (payload: any) => {
    // Check if the new row belongs to this tower
    if (payload.new.tower_id === towerId) {
      // Add the new row to the local state
      setRows(prevRows => [...prevRows, payload.new])
    }
  }

  const handleUpdateRow = (payload: any) => { // Figure out how to add the type here
    // Check if the row belongs to this tower
    if (payload.new.tower_id === towerId) {
      // Find the row that was moved
      const changedRow = rows.find(row => row.id === payload.new.id)
      if (!changedRow) return
      if (changedRow.position !== payload.new.position) {
        // Handle row position change
        // Remove the moved row from the local state
        const newRows = rows.filter(row => row.id !== payload.new.id)
        // Insert the moved row at the new position
        newRows.splice(payload.new.position, 0, changedRow)
        // Update the local state
        setRows(newRows)
      }
    }
  }

  // Subscribe to changes on mount
  useEffect(() => {
    const channel = supabase
    .channel(`tower_${towerId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tower_rows', filter:`tower_id=eq.${towerId}`}, handleInsertRow)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tower_rows', filter:`tower_id=eq.${towerId}`}, handleUpdateRow)
    .subscribe()
    // Cleanup function to unsubscribe from real-time updates
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleAddRow = async () => {
    // Create new row data
    const newRow:TowerRowData = {
      id: crypto.randomUUID() as UUID,
      tower_id: towerData.id,
      name: "",
      position: rows.length,
      users: towerData.users,
    }
  
    // Insert the new row into the database
    const { error } = await supabase.from('tower_rows').insert([newRow])
    if (error) {
      toast({
        title : 'Failed to add new row.',
        description: error.message,
        variant: 'destructive'
      })
      return
    }
    const newRowWithInitialData: TowerRowInitialData = {
      ...newRow,
      clocks: []
    }
    // Update the local state
    setRows(prevRows => [...prevRows, newRowWithInitialData])
  }
  
  const handleRowDelete = async (rowId: UUID) => {
    // Delete the row from the database
    const { error } = await supabase.from('tower_rows').delete().eq('id', rowId)
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
    // Update the local state
    setRows(prevRows => prevRows.filter(row => row.id !== rowId))
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row items-center mx-auto space-x-5">
        <h1 className='text-lg'>{towerData?.name}</h1>
        <Button onClick={handleAddRow}>Add Row</Button>
      </div>
      {rows.map((rowData) => (
        <TowerRow
          key={rowData.id}
          initialData={rowData}
          initialUsedColors={initialUsedColors}
          rowId={rowData.id}
          towerId={towerId}
          users={towerData?.users || []}
          onRowDelete={handleRowDelete}
        />
      ))}
    </div>
  )
}

export default Tower
  function onEffect(arg0: () => React.JSX.Element) {
    throw new Error('Function not implemented.')
  }

