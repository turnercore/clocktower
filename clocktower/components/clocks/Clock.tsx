  'use client'
  import React, { useState, useEffect, ChangeEvent, MouseEvent } from 'react'
  import { PieChart } from 'react-minimal-pie-chart'
  import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
  import { UUID } from 'crypto'
  import { toast } from '@/components/ui'
  import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
  import type { ClockData, ColorPaletteItem } from '@/types'
import ClockSettingsDialog from './ClockSettingsDialog'

  interface ClockProps {
    initialData: ClockData
    initialUsedColors: ColorPaletteItem[]
    towerId: UUID
    rowId: UUID
    onDelete: (clockId: UUID, skipServer?: boolean) => void
  }

  // Define the React component
  const Clock: React.FC<ClockProps> = ({ initialData, initialUsedColors, towerId, rowId, onDelete }) => {
    const clockId = initialData.id
    // Create state variables
    const [clockData, setClockData] = useState<ClockData>(initialData)
    const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null)

    //Find all the colors used in the tower for the color picker
    const [colorPalette, setColorPalette] = useState<ColorPaletteItem[]>(initialUsedColors)
    
    // Init supabase
    const supabase = createClientComponentClient()
  
    const handleClockPayload = (payload: any) => {
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

    const handleTowerClocksChanges = (payload: any) => {
      console.log('Received clock event:', payload)
    
      // Destructure eventType and clockId for easier reference
      const eventType = payload.eventType
      const clockId = payload.new?.id ?? payload.old?.id
      
      switch (eventType) {
        case 'UPDATE':
          const newColor = payload.new?.color
    
          if (newColor) {
            setColorPalette(prevPalette => {
              console.log('prevPalette:', prevPalette)
              const updatedPalette = JSON.parse(JSON.stringify(prevPalette))
    
              // Find and remove clockId from old color
              const oldColorItem = updatedPalette.find((item: ColorPaletteItem) => item.clocksUsing.includes(clockId))
              if (oldColorItem) {
                const index = oldColorItem.clocksUsing.indexOf(clockId)
                if (index > -1) {
                  oldColorItem.clocksUsing.splice(index, 1)
                  // Remove the color entry if no clock is using it
                  if (oldColorItem.clocksUsing.length === 0) {
                    const oldColorIndex = updatedPalette.findIndex((item: ColorPaletteItem) => item.hex === oldColorItem.hex)
                    updatedPalette.splice(oldColorIndex, 1)
                  }
                }
              }
    
              // Add clockId to the new color
              const newColorIndex = updatedPalette.findIndex((item: ColorPaletteItem) => item.hex === newColor)
              if (newColorIndex === -1) {
                updatedPalette.push({ clocksUsing: [clockId], hex: newColor })
              } else {
                updatedPalette[newColorIndex].clocksUsing.push(clockId)
              }
    
              return updatedPalette
            })
          }
          break
    
        case 'DELETE':
          setColorPalette(prevPalette => {
            const updatedPalette = JSON.parse(JSON.stringify(prevPalette))
    
            // Remove clockId from the deleted color
            const deletedColorItem = updatedPalette.find((item: ColorPaletteItem) => item.clocksUsing.includes(clockId))
            if (deletedColorItem) {
              const index = deletedColorItem.clocksUsing.indexOf(clockId)
              if (index > -1) {
                deletedColorItem.clocksUsing.splice(index, 1)
                // Remove the color entry if no clock is using it
                if (deletedColorItem.clocksUsing.length === 0) {
                  const deletedColorIndex = updatedPalette.findIndex((item: ColorPaletteItem) => item.hex === deletedColorItem.hex)
                  updatedPalette.splice(deletedColorIndex, 1)
                }
              }
            }
    
            return updatedPalette
          })
          break
    
        default:
          return
      }
    }
    
    //TESTING C OLOR CHANGES
    useEffect(() => {
      console.log('Updated colorPalette:', colorPalette)
    }, [colorPalette])

  //Subscribe to changes in the clock on the server and handle them appropriately
    useEffect(() => {
      const channel = supabase
      .channel(`clock_${clockId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clocks', filter:`id=eq.${clockId}`}, handleClockPayload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clocks', filter:`tower_id=eq.${towerId}`}, handleTowerClocksChanges)
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
      // Check to see if the value is the same as the current value
      if (event.target.value === clockData.name) return
      updateClockData({name: event.target.value}, clockId)
    }

    const handleIsRoundedChange = async (event: ChangeEvent<HTMLInputElement>) => {
      // Check to see if the value is the same as the current value
      if (event.target.checked === clockData.rounded) return
      updateClockData({rounded: event.target.checked}, clockId)
    }

    const handleLineWidthChange = async (value: number) => {
      // Check to see if the value is the same as the current value
      if (value === clockData.line_width) return
      // Ensure the line width is not less than 1
      if (value < 1) return
      // Ensure the line width is not greater than 50
      if (value > 50) return
      updateClockData({line_width: Number(value)}, clockId)
    }

    const handleSegmentsChange = async (value: number) => {
      // Check to see if the value is the same as the current value
      if (value === clockData.segments) return
      updateClockData({segments: value}, clockId)
    }

    const handleLightenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({lighten_intensity: Number(event.target.value)}, clockId)
    }

    const handleDarkenIntensityChange = async (event: ChangeEvent<HTMLInputElement>) => {
      updateClockData({darken_intensity: Number(event.target.value)}, clockId)
    }

    const handleColorChange = async (hex: string) => {
      // Verify color is a valid hex color
      const colorRegex = /^#([0-9A-F]{3}){1,2}$/i
      if (!colorRegex.test(hex)) {
        console.error('Invalid hex color')
        toast({
          variant: 'destructive',
          title: 'Invalid hex color',
          description: 'Please use a valid hex color.',
        })
        return
      }
      updateClockData({color: hex}, clockId)
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
    const configuredPieChart = (
      <PieChart
          data={updatedData}
          lineWidth={clockData.rounded ? clockData.line_width / 2  : clockData.line_width}  // Custom arc's width for the Donut chart
          paddingAngle={clockData.rounded ? clockData.line_width: clockData.line_width / 4}  // Padding between arcs
          rounded={clockData.rounded ? true : false}
          startAngle={-90}  // Start from the top-right
          segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
          segmentsShift={(index:number) => (index === hoveredSliceIndex ? 0.5 : -0.5)}  // Slight grow on hover
          onClick={handleSliceClick}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
          viewBoxSize={[110, 110]}  // Increase the viewbox dimensions
          center={[55, 55]}  // Move the center of the chart
        />
    )
    return (
      <div className='flex-col relative'> 
        {configuredPieChart}
        <ClockSettingsDialog 
          configuredPieChart={configuredPieChart}
          clockData={clockData}
          colorPalette={colorPalette}
          handleNameChange={handleNameChange}
          handleSegmentsChange={handleSegmentsChange}
          handleIsRoundedChange={handleIsRoundedChange}
          handleLineWidthChange={handleLineWidthChange}
          handleColorChange={handleColorChange}
          handleDelete={handleDelete}
        />
      </div>
    )
  }

  export default React.memo(Clock)
