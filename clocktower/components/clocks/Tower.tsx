'use client';
import React, { useState, useEffect, useMemo } from 'react';
import TowerRow from './TowerRow';
import { Button, Input, ToastAction, toast } from '@/components/ui';  // Make sure to import Button from your UI library
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Tower, UUID } from '@/types';
import { generateName } from '@/tools/clocktowerNameGenerator';

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
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()
  const [rows, setRows] = useState<SortedRowData[]>([])
  const [towerName, setTowerName] = useState<string>('')

  // Fetch user and tower data on load
  useEffect(() => {
    console.log("Fetching user and tower data")
    const fetchAllData = async () => {
      // Fetch user data first
      const { data: userData, error: userError } = await supabase.auth.getSession()
      if (userError) {
        console.error(userError)
        // Notify user
        toast({
          variant: "destructive",
          title: "Error Getting User.",
          description: "Error finding your user session. Are you logged in?",
          action: <ToastAction altText="Login" >Try again</ToastAction>,
        })
        return
      }
      if (!userData?.session?.user) {
        console.error('No user logged in')
        // Notify user
        toast({
          variant: "destructive",
          title: "Error Getting User.",
          description: "Error finding your user session. Are you logged in?",
          action: <ToastAction altText="Login" >Try again</ToastAction>,
        })
        return
      }
      // Set the user
      setUser(userData.session.user)

      // Fetch tower data
      const { data: fetchedTowerData, error: towerError } = await supabase
        .from('towers')
        .select('*')
        .eq('id', towerData.id)
        .contains('users', [userData.session.user.id])
        .single()

      if (towerError) {
        console.error(towerError)
        // Notify user
        toast({
          title: "Tower not found, creating new Tower.",
          description: "Adding new Tower to database. Error message: " + towerError.message,
        })
      }

      console.log("Fetched tower data: ", fetchedTowerData)
      if (!fetchedTowerData) {
        // No data fetched, create a new tower
        const newTowerName = generateName()
        setTowerName(newTowerName)
        const newTower: Tower = {
          id: towerData.id,
          name: newTowerName,
          rows: [],
          // ignore typescript errr
          // @ts-ignore
          users: [userData.session.user.id as UUID], // Add current user to the tower
        }
        console.log('Creating new tower:', newTower)
        console.log(' adding user : ' + userData.session.user.id)
        const { error: insertError } = await supabase.from('towers').insert(newTower)
        
        if (insertError) {
          console.error(insertError)
          // Notify user
          // TODO: Add your toast notification logic here
          toast({
            variant: "destructive",
            title: "Error Creating Tower.",
            description: "Error creating new Tower in database."
          })
          return
        }
        setTowerData(newTower)
        return
      }

      // Set tower data and sorted rows
      setTowerData(fetchedTowerData)
      setTowerName(fetchedTowerData.name)
      const sortedRows = [...fetchedTowerData.rows].sort((a, b) => a.position - b.position)
      setRows(sortedRows)
    }

    // Execute the async function
    fetchAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (!towerData.id) return
    const { error } = await supabase.from('towers').delete().eq('id', towerData.id)
    if (error) {
      console.error(error)
      return
    }
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
    const { error } = await supabase.from('towers').update({ rows: updatedRows }).eq('id', towerData.id).single();
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
    const updatedTowerData = { ...towerData, name: event.target.value }
    setTowerData(updatedTowerData)

    // Log the query for debugging
    console.log(`Updating tower with ID ${towerData.id} to name ${event.target.value}`)

    // Update server state
    const { data, error } = await supabase
      .from('towers')
      .update({ name: event.target.value })
      .eq('id', towerData.id)
      .single()

    // Log server response for debugging
    console.log('Server response data:', data)
    console.log('Server response error:', error)

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
          defaultValue={towerName}
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
            towerId={towerData.id}
            onRowDelete={handleRowDelete}
            // Add updateRow function here
          />
        ))}
      </div>
    </div>
  )
}

export default Tower
