'use client'
import {
  UUID,
  TowerRowType,
  TowerType,
  TowerRowRow,
  ColorPaletteType,
  TowerDatabaseType,
} from '@/types/schemas'
import React, { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TowerRow from './TowerRow'
import { Button, toast } from '@/components/ui'
import TowerSettingsDialog from './TowerSettingsDialog'
import { Database } from '@/types/supabase'
import insertNewTowerRowServerAction from '../actions/insertNewTowerRowServerAction'
import deleteTowerRow from '../actions/deleteTowerRow'
import extractErrorMessage from '@/tools/extractErrorMessage'
import { RealtimePostgresUpdatePayload } from '@supabase/supabase-js'

interface TowerProps {
  tower: TowerType
}

const Tower: React.FC<TowerProps> = ({ tower }) => {
  // Initialize state variables with initialData
  const [towerData, setTowerData] = useState<TowerType>(tower)
  const [rows, setRows] = useState<TowerRowType[]>(tower.rows || [])
  const [colorPaletteValues, setColorPaletteValues] =
    useState<ColorPaletteType>(tower.colors || {})
  const towerId = tower.id

  // Create a ref to keep track of row IDs that have been added locally
  const addedRowIdsRef = useRef<Set<UUID>>(new Set())
  const supabase = createClientComponentClient<Database>()

  // Functions to handle data changes from the server
  const handleInsertRow = (payload: any) => {
    // Check if the new row belongs to this tower
    if (payload.new.tower_id === towerId) {
      // Add the new row to the local state
      if (!addedRowIdsRef.current.has(payload.new.id)) {
        setRows((prevRows) => [...prevRows, payload.new])
        addedRowIdsRef.current.delete(payload.new.id)
      }
    }
  }

  const handleUpdateRow = (payload: any) => {
    // Figure out how to add the type here
    // Check if the row belongs to this tower
    if (payload.new.tower_id !== towerId) return
    // Find the row that was moved
    const changedRow = rows.find((row) => row.id === payload.new.id)
    if (!changedRow) return
    if (changedRow.position !== payload.new.position) {
      // Handle row position change
      // Remove the moved row from the local state
      const newRows = rows.filter((row) => row.id !== payload.new.id)
      // Insert the moved row at the new position
      newRows.splice(payload.new.position, 0, changedRow)
      // Update the local state
      setRows(newRows)
    }
  }

  const handleUpdateTower = (
    payload: RealtimePostgresUpdatePayload<TowerDatabaseType>,
  ) => {
    const updatedTower = payload.new
    if (updatedTower.id !== towerId) return
    // Handle a name change
    if (updatedTower.name !== towerData.name) {
      handleNameChange(updatedTower.name)
    }

    // Handle users array change
    if (payload.new.users !== towerData.users) {
      handleUsersChange(updatedTower.users)
    }
  }

  // Subscribe to changes on mount
  useEffect(() => {
    const subscription = supabase
      .channel(`tower_${towerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tower_rows',
          filter: `tower_id=eq.${towerId}`,
        },
        handleInsertRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tower_rows',
          filter: `tower_id=eq.${towerId}`,
        },
        handleUpdateRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'towers',
          filter: `id=eq.${towerId}`,
        },
        handleUpdateTower,
      )
      .subscribe()
    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, towerId])

  const handleAddRow = async () => {
    // Create a new row object with initial data
    const newRow: TowerRowRow = {
      id: crypto.randomUUID() as UUID, // Generate a unique ID for the new row
      tower_id: towerData.id, // Associate the new row with the current tower
      name: '', // Initialize name as an empty string
      position: rows.length, // Set the position to be at the end of the current rows array
      users: towerData.users, // Copy the users from the tower data to the new row
      color: '#FFFFFF', // Set the color to white
    }

    try {
      // Attempt to insert the new row into the server
      const { error } = await insertNewTowerRowServerAction(newRow)
      if (error) throw new Error(error) // If there's an error, throw it to be caught in the catch block

      const newRowWithInitialData: TowerRowType = {
        ...newRow,
        clocks: [], // Initialize an empty clocks array for the new row
      }

      // If the server action was successful, update the local state to reflect the new row
      addedRowIdsRef.current.add(newRow.id as UUID) // Keep track of the newly added row ID
      setRows((prevRows) => [...prevRows, newRowWithInitialData]) // Append the new row to the rows state
    } catch (error) {
      // If there was an error during any of the above steps, show a toast notification to inform the user
      toast({
        title: 'Failed to add new row.',
        description: extractErrorMessage(error), // Extract and show the error message from the error object
        variant: 'destructive',
      })
    }
  }

  const handleRowDelete = async (rowId: UUID) => {
    try {
      const { error } = await deleteTowerRow(rowId)
      if (error) throw new Error(error)
      // Update the local state
      setRows((prevRows) => prevRows.filter((row) => row.id !== rowId))
    } catch (error) {
      toast({
        title: 'Error',
        description: extractErrorMessage(error),
        variant: 'destructive',
      })
    }
  }

  const handleNameChange = (newName: string) => {
    setTowerData((prevData) => ({ ...prevData, name: newName }))
  }

  const handleUsersChange = (newUsers: string[]) => {
    setTowerData((prevData) => ({ ...prevData, users: newUsers }))
  }

  return (
    <div className='flex flex-col space-y-4'>
      <div className='flex flex-row items-center mx-auto space-x-5'>
        <h1 className='text-lg'>{towerData?.name}</h1>
        <TowerSettingsDialog towerData={towerData} />
      </div>
      {rows.map((rowData) => (
        <TowerRow
          key={rowData.id}
          initialData={rowData}
          onDelete={handleRowDelete}
          towerId={towerId}
          users={towerData.users}
          rowId={rowData.id as UUID}
          colorPalette={colorPaletteValues}
        />
      ))}
      <Button
        onClick={handleAddRow}
        className='max-w-[250px] self-center mx-auto'
      >
        Add Row
      </Button>
    </div>
  )
}

export default Tower
