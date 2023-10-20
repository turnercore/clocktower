'use client'
import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { PieChart, PieChartProps } from 'react-minimal-pie-chart'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from 'crypto'
import { Button, Input, toast } from '../ui'
import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
import type { Clock as ClockData } from '@/types'

interface ClockProps {
  towerId: UUID
  rowId: UUID
  clockId: UUID
  onDelete: (clockId: UUID) => void
}

// Define the React component
const Clock: React.FC<ClockProps> = ({ towerId, rowId, clockId, onDelete }) => {
  // Create state variables
  const [clockData, setClockData] = useState<ClockData>({
    id: clockId,
    rowId: rowId,
    towerId: towerId,
    name: '',
    selectedSliceIndex: null,
    isRounded: false,
    lineWidth: 20,
    segments: 4,
    lightenIntensity: 0.35,
    darkenIntensity: 0.5,
    color: '#E38627', // Default color
    users: [],
  })
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  // Init supabase
  const supabase = createClientComponentClient()

  // On load fetch user and clock data, if no clock data exists, create a new clock
  useEffect(() => {
    const fetchAllDataForClock = async () => {
      console.log("Starting to fetch all data for Clock")

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
          description: "You need to be logged in to fetch clock data.",
        })
        return
      }

      console.log("Fetched user data:", userData.session.user)
      setUser(userData.session.user)

      // Skip fetching clock data if clockId or towerId is not available
      if (!clockId || !towerId) {
        console.log("ClockId or TowerId is missing, skipping clock fetch.")
        return
      }

      console.log(`Fetching clock data for clockId: ${clockId} and towerId: ${towerId}`)

      // Fetch clock data
      const { data: fetchedClockData, error: clockError } = await supabase
        .from('clocks')
        .select('*')
        .eq('id', clockId)
        .contains('users', [userData.session.user.id])
        .single()

      if (clockError) {
        console.error("Clock fetch error:", clockError)
      }

      if (!fetchedClockData) {
        if (!fetchedClockData) {
          console.log("No clock data fetched, creating a new clock")

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
          // Create a new clock object with default values and the current user
          const newClockData: ClockData = {
            id: clockId,
            rowId: rowId,
            towerId: towerId,
            name: '',
            selectedSliceIndex: null,
            isRounded: false,
            lineWidth: 20,
            segments: 4,
            lightenIntensity: 0.35,
            darkenIntensity: 0.5,
            color: '#E38627', // Default color
            users: towerUsers || [userData.session.user.id],  // Add current user to the clock
          };
        
          // Insert new clock data into the database
          const { error: insertError } = await supabase.from('clocks').insert(newClockData)
        
          if (insertError) {
            console.error("Clock insertion error:", insertError)
            toast({
              variant: "destructive",
              title: "Error creating new clock",
              description: insertError.message,
            });
            return
          }
        
          console.log("Successfully created new clock")
        
          // Initialize with default clock data
          setClockData(newClockData);
          return
        }
      } else {
        // Clock data found, update local state.
        console.log("Clock data fetched, updating local state:", fetchedClockData)
        setClockData(fetchedClockData)
      }
        
    }

    // Execute the async function
    fetchAllDataForClock()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sample data for the donut chart
  const chartData = Array.from({ length: clockData.segments }, (_, i) => ({
    title: `Segment ${i + 1}`,
    value: 10,
    color: clockData.color || '#E38627', // Green
  }))


  // Delete the clock
  const handleDelete = async () => {
    const { error } = await supabase.from('clocks').delete().eq('id', clockId)
    if (error) {
      console.error(error)
      return
    }
    onDelete(clockId)
  }

  // General function for updating clock data
  const updateClockData = async (updatedData: Partial<ClockData>, clockId: UUID) => {
    // Capture the old state for possible rollback
    const oldClockData: Partial<ClockData> = {}
    Object.keys(updatedData).forEach(key => {
      const castedKey = key as keyof ClockData // TypeScript cast
      oldClockData[castedKey] = clockData[castedKey] as any  // Type assertion here
    })

    // Optimistically update the state
    setClockData(prevState => ({ ...prevState, ...updatedData }))

    // Update the server
    const { error } = await supabase
      .from('clocks')
      .update(updatedData)
      .eq('id', clockId)
      .single()

    // If the update failed, revert the state
    if (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error updating clock",
        description: error.message,
      })
      // Revert to the old state
      setClockData(prevState => ({ ...prevState, ...oldClockData }))
    }
  }


  // Optimistically update clock name and then update in the database
  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({name: event.target.value}, clockId)
  }

  const handleIsRoundedChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({isRounded: event.target.checked}, clockId)
  }

  const handleLineWidthChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({lineWidth: Number(event.target.value)}, clockId)
  }

  const handleSegmentsChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({segments: Number(event.target.value)}, clockId)
  }

  const handleLightenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({lightenIntensity: Number(event.target.value)}, clockId)
  }

  const handleDarkenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
    updateClockData({darkenIntensity: Number(event.target.value)}, clockId)
  }

  const handleColorChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Verify color is a valid hex color
    const colorRegex = /^#([0-9A-F]{3}){1,2}$/i
    if (!colorRegex.test(event.target.value)) {
      console.error('Invalid hex color')
      toast({
        variant: 'destructive',
        title: 'Invalid hex color',
        description: 'Please use a valid hex color.',
      })
      return
    }
    updateClockData({color: event.target.value}, clockId)
  }


  // Handle slice click
  const handleSliceClick = (event: MouseEvent, dataIndex: number) => {
    if (clockData.selectedSliceIndex === dataIndex || (clockData.selectedSliceIndex !== null && dataIndex < clockData.selectedSliceIndex)) {
      updateClockData({selectedSliceIndex : dataIndex === 0 ? null : dataIndex - 1 }, clockData.id)
    } else {
      updateClockData({selectedSliceIndex : dataIndex }, clockData.id)
    }
  }

  // Handle mouse over slice
  const handleMouseOver = (event: MouseEvent, dataIndex: number) => {
    setHoveredSliceIndex(dataIndex)
  }

  // Handle mouse out of slice
  const handleMouseOut = () => {
    setHoveredSliceIndex(null)
  }

// Update data based on the selected and hovered slice index
const updatedData = chartData.map((entry, index) => {
  let fillColor = 'gray'  // Default color for non-active slices

  // Logic for selected slices
  if (clockData.selectedSliceIndex !== null && index <= clockData.selectedSliceIndex) {
    fillColor = entry.color // Original color for selected slices
  }

  // Trailing Hover Effect
  if (hoveredSliceIndex !== null && index < hoveredSliceIndex) {
    // Apply lighten effect if the segment is not filled
    if (clockData.selectedSliceIndex === null || index > clockData.selectedSliceIndex) {
      fillColor = lightenHexColor(entry.color, clockData.lightenIntensity)
    }
  }

  // Leading Hover Effect
  if (hoveredSliceIndex !== null && index >= hoveredSliceIndex && clockData.selectedSliceIndex !== null && index <= clockData.selectedSliceIndex) {
    fillColor = darkenHexColor(entry.color, clockData.darkenIntensity)
  }

  // Logic for hovered slices
  if (hoveredSliceIndex === index) {
    if (clockData.selectedSliceIndex !== null && index <= clockData.selectedSliceIndex) {
      fillColor = darkenHexColor(entry.color, clockData.darkenIntensity)
    } else {
      fillColor = lightenHexColor(entry.color, clockData.lightenIntensity)
    }
  }

  return {
    ...entry,
    color: fillColor,
  }
})



  return (
    <div className='flex-col'> 
    <Input defaultValue={clockData.name} onBlur={handleNameChange} />
    <PieChart
      data={updatedData}
      lineWidth={clockData.isRounded ? clockData.lineWidth + 5 : clockData.lineWidth}  // Custom arc's width for the Donut chart
      paddingAngle={clockData.isRounded ? clockData.lineWidth + 5 : clockData.lineWidth / 4}  // Padding between arcs
      rounded={clockData.isRounded ? true : false}
      startAngle={-90}  // Start from the top-right
      segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
      segmentsShift={(index) => (index === hoveredSliceIndex ? 0.5 : -0.5)}  // Slight grow on hover
      onClick={handleSliceClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      viewBoxSize={[110, 110]}  // Increase the viewbox dimensions
      center={[55, 55]}  // Move the center of the chart
    />
    <Button onClick={handleDelete}>Delete</Button>
    </div>
  )
}

export default Clock