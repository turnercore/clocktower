  'use client'
  import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
  import { PieChart } from 'react-minimal-pie-chart'
  import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
  import { UUID } from 'crypto'
  import { toast } from '@/components/ui'
  import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
  import type { ClockData } from '@/types'
  import { LuSettings2 } from 'react-icons/lu'

  interface ClockProps {
    initialData: ClockData
    towerId: UUID
    rowId: UUID
    onDelete: (clockId: UUID, skipServer?: boolean) => void
  }

  // Define the React component
  const Clock: React.FC<ClockProps> = ({ initialData, towerId, rowId, onDelete }) => {
    const clockId = initialData.id
    // Create state variables
    const [clockData, setClockData] = useState<ClockData>(initialData)
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null)
    
    // Init supabase
    const supabase = createClientComponentClient()
  
    const handleClockPayload = (payload: any) => {
      console.log('Received payload event:', payload)
      const eventType = payload.eventType
      const data = payload.new
      if(data.id !== clockId) return

      switch (eventType) {
        case 'UPDATE':
          if(data !== clockData) {
            setClockData(data)
          }
          break
        case 'DELETE':
          onDelete(clockId, true)
          break
        default:
          console.error('not valid eventType on payload')
      }
    }

  //Subscribe to changes in the clock on the server and handle them appropriately
    useEffect(() => {
      const channel = supabase
      .channel(`clock_${clockId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clocks', filter:`id=eq.${clockId}`}, handleClockPayload)
      .subscribe()
      // Cleanup function to unsubscribe from real-time updates
      return () => {
        supabase.removeChannel(channel)
      }
    }, [])

    // Create the chart data, this is not used just to make the piechart work
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
      updateClockData({rounded: event.target.checked}, clockId)
    }

    const handleLineWidthChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({line_width: Number(event.target.value)}, clockId)
    }

    const handleSegmentsChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({segments: Number(event.target.value)}, clockId)
    }

    const handleLightenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({lighten_intensity: Number(event.target.value)}, clockId)
    }

    const handleDarkenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({darken_intensity: Number(event.target.value)}, clockId)
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
      if (clockData.filled === dataIndex || (clockData.filled !== null && dataIndex < clockData.filled)) {
        updateClockData({filled : dataIndex === 0 ? null : dataIndex - 1 }, clockData.id)
      } else {
        updateClockData({filled : dataIndex }, clockData.id)
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
      if (clockData.filled !== null && index <= clockData.filled) {
        fillColor = entry.color // Original color for selected slices
      }

      // Trailing Hover Effect
      if (hoveredSliceIndex !== null && index < hoveredSliceIndex) {
        // Apply lighten effect if the segment is not filled
        if (clockData.filled === null || index > clockData.filled) {
          fillColor = lightenHexColor(entry.color, clockData.lighten_intensity)
        }
      }

      // Leading Hover Effect
      if (hoveredSliceIndex !== null && index >= hoveredSliceIndex && clockData.filled !== null && index <= clockData.filled) {
        fillColor = darkenHexColor(entry.color, clockData.darken_intensity)
      }

      // Logic for hovered slices
      if (hoveredSliceIndex === index) {
        if (clockData.filled !== null && index <= clockData.filled) {
          fillColor = darkenHexColor(entry.color, clockData.darken_intensity)
        } else {
          fillColor = lightenHexColor(entry.color, clockData.lighten_intensity)
        }
      }

      return {
        ...entry,
        color: fillColor,
      }
    })

    //Css for the settings icon
    const dotsCss = `absolute top-[5%] right-[3%] w-[15%] h-[15%] text-gray-400 hover:text-[${clockData.color}] hover:bg-gray-200 rounded-full p-1`

    return (
      <div className='flex-col relative'> 
        {/* <Input defaultValue={clockData.name} onBlur={handleNameChange} /> */}
        <PieChart
          data={updatedData}
          lineWidth={clockData.rounded ? clockData.line_width + 5 : clockData.line_width}  // Custom arc's width for the Donut chart
          paddingAngle={clockData.rounded ? clockData.line_width + 5 : clockData.line_width / 4}  // Padding between arcs
          rounded={clockData.rounded ? true : false}
          startAngle={-90}  // Start from the top-right
          segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
          segmentsShift={(index) => (index === hoveredSliceIndex ? 0.5 : -0.5)}  // Slight grow on hover
          onClick={handleSliceClick}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          viewBoxSize={[110, 110]}  // Increase the viewbox dimensions
          center={[55, 55]}  // Move the center of the chart
        />
        <LuSettings2 className={dotsCss}  onClick={handleDelete}/>
      </div>
    )
  }

  export default React.memo(Clock)
