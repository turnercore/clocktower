'use client'
import type{ TowerData, UUID, TowerRowInitialData, TowerInitialData, TowerRowData, ColorPaletteItem } from '@/types'
import React, { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TowerRow from './TowerRow'
import { Button, toast } from '@/components/ui'
import TowerSettingsDialog from './TowerSettingsDialog'

interface TowerProps {
  initialData: TowerInitialData
  initialUsedColors: ColorPaletteItem[]
  towerId: UUID
}

const Tower: React.FC<TowerProps> = ({initialData, initialUsedColors, towerId }) => {
 // Initialize state variables with initialData
  const [towerData, setTowerData] = useState<TowerData>(initialData)
  const [rows, setRows] = useState<TowerRowInitialData[]>(initialData.rows)
  // Create a ref to keep track of row IDs that have been added locally
  const addedRowIdsRef = useRef<Set<UUID>>(new Set());
  const supabase = createClientComponentClient()
 
  // Functions to handle data changes from the server
  const handleInsertRow = (payload: any) => {
    // Check if the new row belongs to this tower
    if (payload.new.tower_id === towerId) {
      // Add the new row to the local state
      if (!addedRowIdsRef.current.has(payload.new.id)) {
        setRows(prevRows => [...prevRows, payload.new]);
        addedRowIdsRef.current.delete(payload.new.id);
      }
    }
  }

  const handleUpdateRow = (payload: any) => { // Figure out how to add the type here
    // Check if the row belongs to this tower
    if (payload.new.tower_id !== towerId) return
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

  const handleUpdateTower = (payload: any) => {
    if (payload.new.id !== towerId) return
    // Handle the name change
    if (payload.new.name !== towerData.name) {
      setTowerData(payload.new)
    }

    // Handle users array change
    if (payload.new.users !== towerData.users) {
      setTowerData(payload.new)
    }
  }




  // Subscribe to changes on mount
  useEffect(() => {
    const subscription = supabase
    .channel(`tower_${towerId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tower_rows', filter:`tower_id=eq.${towerId}`}, handleInsertRow)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tower_rows', filter:`tower_id=eq.${towerId}`}, handleUpdateRow)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'towers', filter:`id=eq.${towerId}`}, handleUpdateTower)
    .subscribe()
    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, towerId])

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
    addedRowIdsRef.current.add(newRow.id);
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
        <TowerSettingsDialog towerData={towerData} />
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
      <Button onClick={handleAddRow} className='max-w-[250px] self-center mx-auto'>Add Row</Button>
    </div>
  )
}

export default Tower