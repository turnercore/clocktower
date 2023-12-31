'use client'
import React, { useState, useEffect, MouseEvent, Suspense } from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from '@/components/ui'
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
import generateUUID from '@/tools/generateId'
import { useAccessibility } from '@/providers/AccessibilityProvider'

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
  const { screenReaderMode } = useAccessibility()

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

  // Shared function to update the filled state and synchronize with the server
  const updateFilledValue = async (inputFilledValue: number | null) => {
    // Guard against invalid input
    let validFilledValue = inputFilledValue

    if (validFilledValue !== null) {
      if (validFilledValue < 0) {
        validFilledValue = 0
      }

      if (validFilledValue >= clockData.segments) {
        // Correct for too high of a value
        validFilledValue = clockData.segments - 1
      }
    }

    if (validFilledValue === clockData.filled) {
      return // Guard against unnecessary updates
    }

    setClockData((prevState) => ({
      ...prevState,
      filled: validFilledValue,
    }))

    const newClockData = {
      filled: validFilledValue,
    }

    const { error } = await updateClockDataSA({ clockId, newClockData })

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

  // Function to handle slice click
  const handleSliceClick = async (event: MouseEvent, dataIndex: number) => {
    const newFilledValue =
      clockData.filled === dataIndex ||
      (clockData.filled !== null && dataIndex < clockData.filled)
        ? dataIndex === 0
          ? null
          : dataIndex - 1
        : dataIndex

    await updateFilledValue(newFilledValue)
  }

  // Function to handle input change for screen readers
  const handleFilledInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const filledValue = parseInt(event.target.value, 10) - 1
    if (
      isNaN(filledValue) ||
      filledValue < 0 ||
      filledValue >= clockData.segments
    ) {
      return // Guard against invalid input
    }
    updateFilledValue(filledValue)
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

  // Function to handle changes in clock name
  const handleNameInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newName = event.target.value
    const oldName = clockData.name

    // Optimistically update local state
    setClockData((prevState) => ({ ...prevState, name: newName }))

    // Update the server
    const response = await updateClockDataSA({
      clockId,
      newClockData: { name: newName },
    })

    if (response.error) {
      console.error('Failed to update name:', response.error)
      toast({
        title: 'Failed to update name',
        description: response.error,
        variant: 'destructive',
      })
      // Revert the local state
      setClockData((prevState) => ({ ...prevState, name: oldName }))
    }
  }

  // Function to handle changes in total segments
  const handleTotalSegmentsInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newSegments = parseInt(event.target.value, 10)
    if (isNaN(newSegments) || newSegments < 1) {
      return // Guard against invalid input
    }

    const oldSegments = clockData.segments
    // Optimistically update local state
    setClockData((prevState) => ({ ...prevState, segments: newSegments }))

    // Update the server
    const response = await updateClockDataSA({
      clockId,
      newClockData: { segments: newSegments },
    })

    if (response.error) {
      console.error('Failed to update segments:', response.error)
      toast({
        title: 'Failed to update segments',
        description: response.error,
        variant: 'destructive',
      })
      // Revert the local state
      setClockData((prevState) => ({ ...prevState, segments: oldSegments }))
    }
  }

  const randomId = generateUUID()
  const screenReaderChart = (
    <Card>
      <CardHeader>
        <CardTitle>{`Clock ${clockData.name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor={`clock-name-${randomId}`}>Clock Name</Label>
        <Input
          id={`clock-name-${randomId}`}
          type='text'
          defaultValue={clockData.name}
          readOnly={!hasEditAccess}
          onChange={handleNameInputChange}
        />

        <Label htmlFor={`clock-filled-${randomId}`}>Filled Segments</Label>
        <Input
          id={`clock-filled-${randomId}`}
          type='number'
          defaultValue={clockData.filled !== null ? clockData.filled + 1 : 0}
          readOnly={!hasEditAccess}
          onChange={handleFilledInputChange}
        />
        <Label htmlFor={`clock-segments-${randomId}`}>Total Segments</Label>
        <Input
          id={`clock-segments-${randomId}`}
          type='number'
          defaultValue={clockData.segments}
          readOnly={!hasEditAccess}
          onChange={handleTotalSegmentsInputChange}
        />
      </CardContent>
      <CardFooter>
        <p>
          Percentage Filled:
          {clockData.filled !== null
            ? Math.floor(((clockData.filled + 1) / clockData.segments) * 100)
            : 0}
        </p>
      </CardFooter>
    </Card>
  )

  let displayedChart: React.JSX.Element

  if (screenReaderMode) {
    displayedChart = screenReaderChart
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
                {hasEditAccess && !screenReaderMode && (
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
