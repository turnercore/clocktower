'use client'
import React, { useState, useEffect, MouseEvent, Suspense } from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Input, Label, toast } from '@/components/ui'
import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
import { ClockRowData, ClockSchema, ClockType, UUID } from '@/types/schemas'
import ClockSettingsDialog from './ClockSettingsDialog'
import type { Database } from '@/types/supabase'
import { updateClockDataSA } from '../actions/updateClockDataSA'
import { deleteClockSA } from '../actions/deleteClockSA'
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import extractErrorMessage from '@/tools/extractErrorMessage'
import useEditAccess from '@/hooks/useEditAccess'

interface RealtimeClockProps {
  initialData: ClockType
}

// Define the React component
const RealtimeClock: React.FC<RealtimeClockProps> = ({ initialData }) => {
  const clockId = initialData.id
  const towerId = initialData.tower_id
  const rowId = initialData.row_id

  // Create state variables
  const [clockData, setClockData] = useState<ClockType>(initialData)
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
    null,
  )
  const [isDeleted, setIsDeleted] = useState<boolean>(false)
  const hasEditAccess = useEditAccess(towerId)

  // Init supabase
  const supabase = createClientComponentClient<Database>()

  const handleRealtimeClockUpdate = (
    payload: RealtimePostgresUpdatePayload<ClockRowData>,
  ) => {
    const newData = payload.new
    if (newData.id !== clockId) return
    if (newData !== clockData) {
      setClockData(newData)
    }
  }

  const handleRealtimeClockDelete = (
    payload: RealtimePostgresDeletePayload<ClockRowData>,
  ) => {
    if (isDeleted) return
    const deletedData = payload.old
    if (deletedData.id !== clockId) return

    // We be deleted
    setIsDeleted(true)
  }

  //Subscribe to changes in the clock on the server and handle them appropriately
  useEffect(() => {
    const subscription = supabase
      .channel(`clock_${clockId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clocks',
          filter: `id=eq.${clockId}`,
        },
        handleRealtimeClockUpdate,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'clocks',
          filter: `id=eq.${clockId}`,
        },
        handleRealtimeClockDelete,
      )
      .subscribe()
    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [
    clockId,
    towerId,
    supabase,
    handleRealtimeClockUpdate,
    handleRealtimeClockDelete,
  ])

  // Create the chart data, this is not used just to make the piechart work
  const chartData = Array.from({ length: clockData.segments }, (_, i) => ({
    title: `Segment ${i + 1}`,
    value: 10,
    color: clockData.color || '#E38627', // Green
  }))

  // Delete the clock
  const handleDelete = async () => {
    setIsDeleted(true)
    const { error } = await deleteClockSA({ clockId, towerId })
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting clock',
        description: error,
      })
      setIsDeleted(false)
    }
  }

  const updateClockData = (updatedData: Partial<ClockType>) => {
    setClockData((prevState) => ({ ...prevState, ...updatedData }))
  }

  // Handle state changes:
  const handleStateChange = (key: keyof ClockType, value: any) => {
    try {
      // zod validation of the value
      const partialClockDataSchema = ClockSchema.partial()
      // validate with parse
      const validatedData = partialClockDataSchema.parse({ [key]: value })
      // update state
      if (clockData[key] !== validatedData[key]) {
        updateClockData({ [key]: validatedData[key] })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error updating state',
        description: extractErrorMessage(error),
      })
    }
  }

  // This one actually updates the server
  const handleSliceClick = async (event: MouseEvent, dataIndex: number) => {
    let newFilledValue: number | null

    if (
      clockData.filled === dataIndex ||
      (clockData.filled !== null && dataIndex < clockData.filled)
    ) {
      newFilledValue = dataIndex === 0 ? null : dataIndex - 1
    } else {
      newFilledValue = dataIndex
    }

    // Optimistically update local state
    setClockData((prevState) => ({
      ...prevState,
      filled: newFilledValue,
    }))

    // Prepare data for server update
    const newClockData = {
      filled: newFilledValue,
    }

    // Update the server
    const { error } = await updateClockDataSA({ clockId, newClockData })

    // In case of an error, revert to previous state
    if (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error updating slice',
        description: error,
      })
      setClockData((prevState) => ({
        ...prevState,
        filled: clockData.filled, // Revert to previous filled value
      }))
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
    let fillColor = 'gray' // Default color for non-active slices

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
    if (
      hoveredSliceIndex !== null &&
      index >= hoveredSliceIndex &&
      clockData.filled !== null &&
      index <= clockData.filled
    ) {
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

  //TODO: Right now filled = 0 really means 1 thing is filled and null is 0, change that so 0 is 0 and 1 is 1

  //Css for the settings icon
  const configuredPieChart = (
    <PieChart
      data={updatedData}
      lineWidth={
        clockData.rounded ? clockData.line_width / 2 : clockData.line_width
      } // Custom arc's width for the Donut chart
      paddingAngle={
        clockData.rounded ? clockData.line_width : clockData.line_width / 4
      } // Padding between arcs
      rounded={clockData.rounded ? true : false}
      startAngle={-90} // Start from the top-right
      segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
      segmentsShift={(index: number) =>
        index === hoveredSliceIndex ? 0.5 : -0.5
      } // Slight grow on hover
      onClick={handleSliceClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      viewBoxSize={[110, 110]} // Increase the viewbox dimensions
      center={[55, 55]} // Move the center of the chart
    />
  )

  const readOnlyPieChart = (
    <PieChart
      data={updatedData}
      lineWidth={
        clockData.rounded ? clockData.line_width / 2 : clockData.line_width
      } // Custom arc's width for the Donut chart
      paddingAngle={
        clockData.rounded ? clockData.line_width : clockData.line_width / 4
      } // Padding between arcs
      rounded={clockData.rounded ? true : false}
      startAngle={-90} // Start from the top-right
      segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
      segmentsShift={(index: number) =>
        index === hoveredSliceIndex ? 0.5 : -0.5
      } // Slight grow on hover
      viewBoxSize={[110, 110]} // Increase the viewbox dimensions
      center={[55, 55]} // Move the center of the chart
    />
  )

  const reducedMotionChart = (
    <div className='reduced-motion-chart'>
      <Label htmlFor='clock-name'>Clock Name</Label>
      <Input id='clock-name' value={clockData.name} readOnly={hasEditAccess} />

      <Label htmlFor='clock-filled'>Filled Segments</Label>
      <Input
        id='clock-filled'
        type='number'
        value={clockData.filled !== null ? clockData.filled + 1 : 0}
        readOnly={!hasEditAccess}
      />

      <p>
        Percentage Filled:
        {clockData.filled !== null
          ? Math.floor(((clockData.filled + 1) / clockData.segments) * 100)
          : 0}
      </p>
    </div>
  )

  const reduceMotion = true

  let displayedChart: React.JSX.Element

  if (reduceMotion) {
    displayedChart = reducedMotionChart
  } else if (hasEditAccess) {
    displayedChart = configuredPieChart
  } else {
    displayedChart = readOnlyPieChart
  }

  return (
    <>
      {!isDeleted && (
        <div className='flex flex-col items-center'>
          <div className='flex flex-row relative'>
            <div className='flex flex-col items-center max-w-[400px] min-w-fit rounded-full'>
              {displayedChart}
            </div>
            <Suspense>
              <div className='absolute right-0'>
                {hasEditAccess && !reduceMotion && (
                  <ClockSettingsDialog
                    configuredPieChart={configuredPieChart}
                    clockData={clockData}
                    onStateChange={handleStateChange}
                    onDelete={handleDelete}
                  />
                )}
              </div>
            </Suspense>
          </div>

          <div className='flex flex-row items-center text-center space-x-2 mt-1'>
            <h2 className='text-xl font-thin text-center'>{clockData.name}</h2>
          </div>
        </div>
      )}
    </>
  )
}
export default RealtimeClock
