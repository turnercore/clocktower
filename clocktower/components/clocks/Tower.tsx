'use client'
import type{ TowerData, UUID, TowerRowInitialData, TowerInitialData } from '@/types'
import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TowerRow from './TowerRow'
import { Button, toast } from '@/components/ui'

interface TowerProps {
  initialData: TowerInitialData
  towerId: UUID
}

const Tower: React.FC<TowerProps> = ({initialData, towerId }) => {
 // Initialize state variables with initialData
 const [towerData, setTowerData] = useState<TowerData | null>(initialData)
 const [rows, setRows] = useState<TowerRowInitialData[]>(initialData.rows)
 
  // Functions to handle data changes from the server
  const handleNewRow = (payload: any) => {
    // Check if the new row belongs to this tower
    if (payload.new.tower_id === towerId) {
      // Add the new row to the local state
      setRows(prevRows => [...prevRows, payload.new])
    }
  }

  // Init supabase and subscribe to table changes
  const supabase = createClientComponentClient()
  supabase
    .channel(`tower_row_${towerId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tower_rows', filter:`tower_id=eq.${towerId}`}, handleNewRow)
    .subscribe()
  // If towerId is 'new', create a new UUID

  const handleAddRow = async () => {
    // Create new row data
    const newRow = {
      id: crypto.randomUUID(),
      tower_id: towerId,
      name: "New Row",
      // ... other fields
    }
  
    // Insert the new row into the database
    const { error } = await supabase.from('tower_rows').insert([newRow])
    if (error) {
      toast.error('Failed to add new row.')
      return
    }
  
    // Update the local state
    setRows(prevRows => [...prevRows, newRow])
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
      <div className="flex justify-between items-center">
        <h1>{towerData?.name}</h1>
        <Button onClick={handleAddRow}>Add Row</Button>
      </div>
      {rows.map((rowData) => (
        <TowerRow
          key={rowData.id}
          initialData={rowData}
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
