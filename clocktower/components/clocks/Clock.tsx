'use client'
import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
import { PieChart, PieChartProps } from 'react-minimal-pie-chart'
import { User, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from 'crypto'
import { Button, Input } from '../ui'
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
    const fetchClockData = async (clockId: UUID) => {
      const { data, error } = await supabase
        .from('clocks')
        .select('*')
        .eq('id', clockId)
        .single()

      if (error) {
        console.error(error)
        return
      }
      return data
    }

    const createNewClock = async (data: ClockData) => {
      const { error } = await supabase.from('clocks').insert([data])
    }

    const setUserWithSessionAndGetClockData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getSession()
      // Error handling
      if (userError) {
        console.error(userError)
        return null
      }
      if (!userData.session || !userData.session.user) {
        console.error('No user logged in')
        return null
      }
      //Set the user
      setUser(userData.session.user)

      // Get clock data from database if it exists
      const fetchedData: ClockData = await fetchClockData(clockData.id)
      if (fetchedData) {
        setClockData(fetchedData)
      } else {
        // No data feteched create a new clock
        // Get allowed users from the tower
        const { data: towerData, error: towerError } = await supabase.from('towers').select('users').eq('id', towerId).contains('users', userData.session.user.id).single()
        if (towerError) {
          console.error(towerError)
        }
        // Add allowed users to the clock list of users
        const newClockData = {...clockData, users: towerData?.users || [userData.session.user.id as UUID]}
        // Save the new clock to the local state
        setClockData(newClockData)
        // Save the new clock to the database
        const { error } = await supabase.from('clocks').insert(newClockData)
      } 
    }

    setUserWithSessionAndGetClockData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, towerId])

  // Sample data for the donut chart
  const chartData = Array.from({ length: clockData.segments }, (_, i) => ({
    title: `Segment ${i + 1}`,
    value: 10,
    color: clockData.color || '#E38627', // Green
  }))

  // Handle mouse over slice
  const handleMouseOver = (event: MouseEvent, dataIndex: number) => {
    setHoveredSliceIndex(dataIndex)
  }

  // Handle mouse out of slice
  const handleMouseOut = () => {
    setHoveredSliceIndex(null)
  }

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
    // Optimistically update the state
    setClockData(prevState => ({ ...prevState, ...updatedData }))

    // Update the server
    const { error } = await supabase
      .from('clocks')
      .update(updatedData)
      .eq('id', clockId)
      .contains('users', user?.id as UUID)
      .single()

    // If the update failed, revert the state
    if (error) {
      console.error(error)
      setClockData(prevState => {
        const revertedData: Partial<ClockData> = {}
        Object.keys(updatedData).forEach(key => {
          const castedKey = key as keyof ClockData  // TypeScript cast
          revertedData[castedKey] = prevState[castedKey] as any  // Type assertion here
        })
        return { ...prevState, ...revertedData }
      })
    }
  }


  // Update clock name
  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const updatedData = {...clockData, name: event.target.value}
    setClockData(updatedData)
  }

  // Handle slice click
  const handleSliceClick = (event: MouseEvent, dataIndex: number) => {
    if (clockData.selectedSliceIndex === dataIndex || (clockData.selectedSliceIndex !== null && dataIndex < clockData.selectedSliceIndex)) {
      updateClockData({selectedSliceIndex : dataIndex === 0 ? null : dataIndex - 1 }, clockData.id)
    } else {
      updateClockData({selectedSliceIndex : dataIndex }, clockData.id)
    }
  }

  // Update data based on the selected and hovered slice index
  const updatedData = chartData.map((entry, index) => {
    let fillColor = 'gray'  // Default color for non-active slices

    if (clockData.selectedSliceIndex !== null && index <= clockData.selectedSliceIndex) {
      fillColor = entry.color // Original color for selected slices
    }

    if (hoveredSliceIndex === index) {
      // If already filled darken color for hovered slices
      if (clockData.selectedSliceIndex !== null && index <= clockData.selectedSliceIndex) {
        fillColor = darkenHexColor(entry.color, clockData.darkenIntensity)
      } else {
        fillColor = lightenHexColor(entry.color, clockData.lightenIntensity) // Lighten color for hovered slices
      }
    } else if (hoveredSliceIndex !== null) {
      // Removed stray "clockData." that seemed like a typo
      // (your logic here)
    }

    return {
      ...entry,
      color: fillColor,
    }
  })

  return (
    <div className='flex-col'> 
    <Input value={clockData.name} onBlur={handleNameChange} />
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