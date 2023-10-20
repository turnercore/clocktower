'use client';
import React, { useState, useEffect } from 'react';
import TowerRow from './TowerRow';
import { Button, Input, ToastAction, toast } from '@/components/ui';  // Make sure to import Button from your UI library
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SortedRowData, Tower, UUID } from '@/types';
import { generateName } from '@/tools/clocktowerNameGenerator';
import { isValidUUID } from '@/tools/isValidUUID';

interface TowerProps {
  towerId?: UUID;
}

const Tower: React.FC<TowerProps> = ({ towerId }) => {
  // Create a new Tower ID if one was not provided
  // Check if towerId is valid UUID
  if (!towerId || !isValidUUID(towerId)) towerId = crypto.randomUUID() as UUID

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
  // Prevent duplicate row adds
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [isAddingTower, setIsAddingTower] = useState(false)


  // Fetch user and tower data on load
  useEffect(() => {
    console.log("Fetching user and tower data")
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
      const { data: fetchedTowerData, error: towerError } = await supabase
        .from('towers')
        .select('*')
        .eq('id', towerData.id)
        .contains('users', [userData.session.user.id])
        .single()

      if (towerError) {
        console.error(towerError)
      }

      console.log("Fetched tower data: ", fetchedTowerData)
      if (!fetchedTowerData) {
        // No data fetched, create a new tower
        if (isAddingTower) return
        setIsAddingTower(true)
        const newTowerName = generateName()
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
        // Add tower and user to the towers_users join table
        const { error: insertJoinError } = await supabase.from('towers_users').insert({ towerId: newTower.id, userId: userData.session.user.id })
        setIsAddingTower(false)
        if (insertError) {
          console.error(insertError)
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
      if (fetchedTowerData.rows) {
        const sortedRows = [...fetchedTowerData.rows].sort((a, b) => a.position - b.position)
        setRows(sortedRows)
      } else {
        setRows([])
      }
    }

    // Execute the async function
    fetchAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //--- Functions for handling data changes ---//

  // Add a new row to the tower (For add row button)
  const handleAddRow = async () => {
    console.log('handleAddRow called')
    if(isAddingRow) {
      console.log('Already adding a row')
      toast({
        title: "Already Adding Row.",
        description: "You are already adding a row. Wait a sec."
      })
      return
    }
    setIsAddingRow(true)
    
    if(!towerData) {
      console.log('towerData is null or undefined')
      return
    }

    // Generate new row data
    const newRowData = {
      rowId: crypto.randomUUID() as UUID,  // Changed from id to rowId
      position: rows.length  // Fixed typo
    }

    // Capture the old state for possible rollback
    const oldRows = towerData.rows ? [...towerData.rows] : []
    const oldTowerData = { ...towerData }

    // Create the new updated rows array
    const updatedRowsArray = towerData.rows ? [...towerData.rows, newRowData] : [newRowData]

    // Optimistically update local state
    const updatedTowerData = { ...towerData, rows: updatedRowsArray }
    setTowerData(updatedTowerData)
    setRows(updatedRowsArray)

    // Update the server
    const { data, error } = await supabase
      .from('towers')
      .update({ rows: updatedRowsArray })
      .eq('id', towerData.id)
      .single()

    if (error) {
      console.error('Failed to add new row:', error.message)
      toast({
        title: "Error Adding Row.",
        description: "Error adding new row to database."
      })
      // Revert local state
      setRows(oldRows)
      setTowerData(oldTowerData)
      return
    }

    console.log('Successfully added new row')
    setIsAddingRow(false)
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
    const oldRows = rows ? [...rows] : []
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

  // // Update the local and server state when the tower name is changed
  // const handleTowerNameChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   // Get old name
  //   const oldName = towerData ? towerData.name : ''
  //   console.log('Old name: ', oldName)
  //   console.log('New name: ', event.target.value)
  //   if (oldName === event.target.value) return
  //   // Update local state
  //   const updatedTowerData = { ...towerData, name: event.target.value }
  //   setTowerData(updatedTowerData)

  //   // Log the query for debugging
  //   console.log(`Updating tower with ID ${towerData.id} to name ${event.target.value}`)

  //   // Update server state
  //   const { data, error } = await supabase
  //     .from('towers')
  //     .update({ name: event.target.value })
  //     .eq('id', towerData.id)
  //     .single()

  //   // Error handling
  //   if (error) {
  //     console.error(error)
  //     // Revert local state
  //     setTowerData({ ...towerData, name: oldName })
  //     return
  //   }
  // }


  return (
    <div className="flex flex-col space-y-4">
      {/* Input for Tower Name */}
      <div className="mx-auto w-full max-w-md text-center flex flex-row space-x-2">
        <h1 className="text-3xl font-serif mx-auto"> {towerData.name} </h1>
        <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleAddRow}>
          Add Row
        </Button>
      </div>
      {/* Rows */}
        <div className="flex flex-col space-y-10 w-full mx-3 max-w-full">
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
