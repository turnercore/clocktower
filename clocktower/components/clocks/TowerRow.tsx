'use client'
import React, { useState, useEffect } from 'react'
import Clock from './Clock'
import { Button, Input } from '@/components/ui'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from 'crypto'

type SortedClockData = {
  clockId: UUID
  position: number
};

interface TowerRowProps {
  rowId: UUID
  towerId: UUID
  onRowDelete: (rowId: UUID) => void
}

const TowerRow: React.FC<TowerRowProps> = ({ rowId, towerId, onRowDelete }) => {
  const [clocks, setClocks] = useState<SortedClockData[]>([])
  const [rowName, setRowName] = useState<string>('')
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  // Fetch user and row data on load
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch user data first
      const { data: userData, error: userError } = await supabase.auth.getSession()
      if (userError) {
        console.error(userError)
        return
      }
      if (!userData?.session?.user) {
        console.error('No user logged in')
        return
      }
      // Set the user
      setUser(userData.session.user)

      // Skip fetching row data if rowId is not available
      if (!rowId) return

      // Fetch row data
      const { data: rowData, error: rowError } = await supabase
        .from('tower_rows')
        .select('*')
        .eq('id', rowId)
        .contains('users', [userData.session.user.id])
        .single()
      if (rowError) {
        console.error(rowError)
        return
      }
      if (!rowData) {
        // No data fetched, create a new row
        const newRow = {
          id: rowId,
          name: '',
          clocks: [],
          users: [userData.session.user.id as UUID]  // Add current user to the row
        }
        setRowName(newRow.name)
        setClocks([])  // New row, so empty clocks
        const { error: insertError } = await supabase.from('tower_rows').insert(newRow)
        if (insertError) {
          console.error(insertError)
        }
        return
      }
      // Set row data and sorted clocks
      setRowName(rowData.name)
      const sortedClocks = [...rowData.clocks].sort((a, b) => a.position - b.position)
      setClocks(sortedClocks)
    }

    // Execute the async function
    fetchAllData()
  }, [supabase, rowId])
  
  const addClock = () => {
    const newClockData = {
      clockId: crypto.randomUUID() as UUID,
      position: clocks.length,
    }
    setClocks([...clocks, newClockData])
  }

  // Update the Row's name on the server and local states
  const handleRowNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!rowId || !rowName) return
    // Get old row name
    const oldRowName = rowName
    // Update local state
    setRowName(event.target.value);
    // Update the server
    const { error } = await supabase.from('tower_rows').update({ name: rowName }).eq('id', rowId).single();
    // Handle Errors
    if (error) {
      console.error(error);
      // Revert if error
      setRowName(oldRowName)
      return;
    }
  }

  // Update the server and delete the row
  const handleRowDelete = async () => {
    if (!rowId) return;
    // Delete from the server
    const { error } = await supabase.from('tower_rows').delete().eq('id', rowId).single();
    if (error) {
      console.error(error);
      return;
    }
    // Delete local state and update the tower
    onRowDelete(rowId);
  }

  // Update local and server state when a clock is deleted tower_row.clocks should be updated
  const handleClockDelete = async (clockId: UUID) => {
        // Update the server by removing the clock
        if (!towerId) return;
        const updatedClocks = clocks.filter((clock) => clock.clockId !== clockId);
        //Reoder the clocks by position
        const reorderedClocks = updatedClocks.map((clock, index) => ({ ...clock, position: index }));
        const { error } = await supabase.from('tower_rows').update({ clocks: reorderedClocks }).eq('id', rowId).single();
        if (error) {
          console.error(error);
          return;
        }
        // Update the local state by removing the clock
        setClocks(reorderedClocks);
  }

  return (
    <div>
      <Input 
        placeholder="Row" 
        value={rowName} 
        onBlur={handleRowNameChange} />
      <Button onClick={addClock}>+</Button>
      <Button onClick={handleRowDelete}>Delete Row</Button>
      {clocks.map(({ clockId }, index) => (
        <Clock key={clockId} clockId={clockId} towerId={towerId} rowId={rowId} onDelete={handleClockDelete}/>
      ))}
    </div>
  )
}


export default TowerRow
