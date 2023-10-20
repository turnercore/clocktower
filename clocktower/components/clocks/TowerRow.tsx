'use client'
import React, { useState, useEffect } from 'react'
import Clock from './Clock'
import { Button, Card, CardContent, CardTitle, Input, ScrollArea, ScrollBar, ToastAction, toast } from '@/components/ui'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from 'crypto'
import { sanitizeString } from '@/tools/sanitizeStrings'
import { SortedClockData } from '@/types'
import { ClockIcon, PlusIcon, DragHandleHorizontalIcon } from '@radix-ui/react-icons'


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

  // Fetch self and get data, or create a new row if no data exists on mount
  useEffect(() => {
    const fetchAllData = async () => {
      console.log("Starting to fetch all data for TowerRow")
  
      // Fetch user data first
      const { data: userData, error: userError } = await supabase.auth.getSession()
      if (userError) {
        console.error("User fetch error:", userError)
        toast({
          variant: "destructive",
          title: "Error fetching user data",
          description: userError.message,
        })
        return
      }
      if (!userData?.session?.user) {
        console.log("No user logged in")
        toast({
          variant: "destructive",
          title: "User not logged in",
          description: "You need to be logged in to fetch row data.",
        })
        return
      }
      
      console.log("Fetched user data:", userData.session.user)
      // Set the user
      setUser(userData.session.user)
  
      // Skip fetching row data if rowId or towerId is not available
      if (!rowId || !towerId) {
        console.log("RowId or TowerId is missing, skipping row fetch.")
        return
      }
  
      console.log(`Fetching row data for rowId: ${rowId} and towerId: ${towerId}`)
  
      // Fetch row data
      const { data: fetchedRowData, error: rowError } = await supabase
        .from('tower_rows')
        .select('*')
        .eq('id', rowId)
        .contains('users', [userData.session.user.id])
        .single()
  
      if (rowError) {
        console.error("Row fetch error:", rowError)
      }
  
      if (!fetchedRowData) {
        console.log("No row data fetched, creating a new row")
        // Get users list from the tower
        const {data:towerData, error:towerUsersError} = await supabase.from('towers').select('users').eq('id', towerId).single()
        const towerUsers: UUID[] = towerData?.users || []
        if(towerUsersError || !towerUsers || towerUsers.includes(userData.session.user.id as UUID) === false) {
          console.error("Error fetching tower users:", towerUsersError)
          toast({
            variant: "destructive",
            title: "Error fetching tower users",
            description: towerUsersError?.message || "Error fetching tower users",
          })
          return
        }
        // No data fetched, create a new row
        const newRow = {
          id: rowId,
          towerId: towerId,
          name: '',
          clocks: [],
          users: towerUsers || [userData.session.user.id as UUID] 
        }
        const { error: insertError } = await supabase.from('tower_rows').insert(newRow)
        if (insertError) {
          console.error("Row insertion error:", insertError)
          toast({
            variant: "destructive",
            title: "Error creating new row",
            description: insertError.message,
          })
          return
        }
        
        console.log("Successfully created new row")
  
        // Initialize with empty data
        setRowName(newRow.name)
        setClocks([])  // New row, so empty clocks
        return
      }
      
      console.log("Row data fetched, updating local state:", fetchedRowData)
      // Existing row fetched; update local state
      setRowName(fetchedRowData.name)
      const sortedClocks = sortClocks(fetchedRowData.clocks)
      setClocks(sortedClocks)
    }
  
    // Execute the async function
    fetchAllData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const sortClocks = (clocks: SortedClockData[]) => {
    return [...clocks].sort((a, b) => a.position - b.position)
  }
  
  const addClock = async () => {
    // Update clocks with new data
    const newClockData = {
      clockId: crypto.randomUUID() as UUID,
      position: clocks.length,
    }
    const oldClockData = clocks ? [...clocks] : []
    const updatedClocks = clocks ? [...clocks, newClockData] : [newClockData]
    setClocks(updatedClocks)
    // Update the server
    const { data, error } = await supabase.from('tower_rows').update({ clocks: updatedClocks }).eq('id', rowId).single()
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
      return
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
  const handleClockDelete = async (clockId: UUID) => {
        // Update the server by removing the clock
        if (!towerId) return
        const updatedClocks = clocks.filter((clock) => clock.clockId !== clockId)
        //Reoder the clocks by position
        const reorderedClocks = updatedClocks.map((clock, index) => ({ ...clock, position: index }))
        const { error } = await supabase.from('tower_rows').update({ clocks: reorderedClocks }).eq('id', rowId).single()
        if (error) {
          console.error(error)
          return
        }
        // Update the local state by removing the clock
        setClocks(reorderedClocks)
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
        <Button onClick={handleRowDelete}>Delete Row</Button>
      </CardTitle>
      {/* Clocks */}
      <CardContent>
      <ScrollArea className='overflow-auto'>
        <div className='flex flex-row width-full items-center space-x-4'>
        {clocks.map(({ clockId }, index) => (
          <>
          <div key={clockId} className='min-w-[150px]'>
            <Clock key={clockId} clockId={clockId} towerId={towerId} rowId={rowId} onDelete={handleClockDelete}/>
          </div>
          </>
        ))}
        <Button variant='ghost'className='h-24 w-24' onClick={addClock}><PlusIcon className='h-6 w-6' /><ClockIcon className='ml-1 h-8 w-8'/></Button>
        </div>
        <ScrollBar orientation='horizontal' className='w-full' />
        </ScrollArea> 
      </CardContent>
    </Card>
  )
}


export default TowerRow
