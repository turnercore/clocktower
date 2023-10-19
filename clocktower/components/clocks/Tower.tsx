'use client';
import React, { useState, useEffect, useMemo } from 'react';
import TowerRow from './TowerRow';
import { Button, Input } from '@/components/ui';  // Make sure to import Button from your UI library
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tower, UUID } from '@/types';

interface TowerProps {
  towerId?: UUID;
}

interface SortedRowData {
  rowId: UUID;  // Changed from id to rowId
  position: number;
}

const Tower: React.FC<TowerProps> = ({ towerId }) => {
  // Create a new Tower ID if one was not provided
  if (!towerId) towerId = crypto.randomUUID() as UUID

  // Create state variables
  const [towerData, setTowerData] = useState<Tower>({
    id: towerId,
    name: '',
    rows: [],
    users: [],
  })
  const [id, setId] = useState<UUID>(towerId)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<SortedRowData[]>([])

  // Fetch user and tower data on load
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

      // Fetch tower data
      const { data: towerData, error: towerError } = await supabase
        .from('towers')
        .select('*')
        .eq('id', id)
        .contains('users', userData.session.user.id)
        .single()
      if (towerError) {
        console.error(towerError)
        return
      }
      if (!towerData) {
        // No data fetched, create a new tower
        const newTower: Tower = {...towerData, users: [userData.session.user.id as UUID]}  // Add current user to the tower
        setTowerData(newTower)
        const { error: insertError } = await supabase.from('towers').insert(newTower).single()
        if (insertError) {
          console.error(insertError)
        }
        return
      }
      // Set tower data and sorted rows
      setTowerData(towerData)
      const sortedRows = [...towerData.rows].sort((a, b) => a.position - b.position)
      setRows(sortedRows)
    }

    // Execute the async function
    fetchAllData()
  }, [supabase, id])

  //--- Functions for handling data changes ---//

  // Add a new row to the tower (For add row button)
  const handleAddRow = () => {
    if(!towerData) return
    const newRowData = {
      rowId: crypto.randomUUID() as UUID,  // Changed from id to rowId
      position: rows.length  // Fixed typo
    };
    const updatedTowerData = { ...towerData, rows: [...towerData.rows, newRowData] };  // Immutability
    setTowerData(updatedTowerData);
    setRows([...rows, newRowData]);
  }

  // Delete the tower (For delete button), delete the database and then create a new tower
  const deleteTower = async () => {
    if (!id) return
    const { error } = await supabase.from('towers').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    // Get a new id which should trigger a new tower to be created in the useEffect
    setId(crypto.randomUUID() as UUID)
  }

  // Update local and server state when a row is deleted
  const handleRowDelete = async (rowId: UUID) => {
    // Update the server by removing the row
    const updatedRows = rows.filter((row) => row.rowId !== rowId);
    const updatedTowerData = { ...towerData, rows: updatedRows };
    //Optomistic update local state
    const oldRows = [...rows]
    const oldTowerData = { ...towerData }
    setRows(updatedRows);
    setTowerData(updatedTowerData);
    const { error } = await supabase.from('towers').update({ rows: updatedRows }).eq('id', id).single();
    if (error) {
      console.error(error);
      // Revert local state
      setRows(oldRows)
      setTowerData(oldTowerData)
      return;
    }
  }

  // Update the local and server state when the tower name is changed
  const handleTowerNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get old name
    const oldName = towerData ? towerData.name : ''
    // Update local state
    setTowerData({ ...towerData, name: event.target.value })
    // Update server state
    const { error } = await supabase.from('towers').update({ name: event.target.value }).eq('id', id).single()
    // Error handling
    if (error) {
      console.error(error)
      // Revert local state
      setTowerData({ ...towerData, name: oldName })
      return
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Input for Tower Name */}
      <div className="w-full max-w-md">
        <Input 
          className="w-full p-2 border rounded" 
          value={towerData.name} 
          onBlur={handleTowerNameChange} 
          placeholder="Enter Tower Name"
        />
      </div>
      
      {/* Add Row and Settings Buttons */}
      <div className="flex space-x-2">
        <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAddRow}>
          Add Row
        </Button>
        <Button className="bg-gray-300 text-gray-800 px-4 py-2 rounded">
          ⛭
        </Button>
      </div>

      {/* Rows */}
      <div className="w-full max-w-md space-y-2">
        {rows.map(({ rowId }) => (
          <TowerRow
            key={rowId}
            rowId={rowId}
            towerId={id}
            onRowDelete={handleRowDelete}
            // Add updateRow function here
          />
        ))}
      </div>
    </div>
  )
}

export default Tower
