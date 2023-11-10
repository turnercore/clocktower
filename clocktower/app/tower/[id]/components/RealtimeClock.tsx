'use client'
import React, {
  useState,
  useEffect,
  MouseEvent,
  useMemo,
  useCallback,
} from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/components/ui'
import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
import { ClockRowData, ClockSchema, ClockType, UUID } from '@/types/schemas'
import { ClockSettingsDialog } from './ClockSettingsDialog'
import type { Database } from '@/types/supabase'
import updateClockDataServerAction from '../actions/updateClockDataServerAction'
import { deleteClockSA } from '../actions/deleteClockSA'
import objectToFormData from '@/tools/objectToFormData'
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import extractErrorMessage from '@/tools/extractErrorMessage'

interface RealtimeClockProps {
  initialData: ClockType
}

// Define the React component
export const RealtimeClock: React.FC<RealtimeClockProps> = ({
  initialData,
}) => {
  const clockId = initialData.id as UUID
  const towerId = initialData.tower_id as UUID
  const rowId = initialData.row_id as UUID

  // Create state variables
  const [clockData, setClockData] = useState<ClockType>(initialData)
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
    null,
  )
  const [isDeleted, setIsDeleted] = useState<boolean>(false)

  // Init supabase
  const supabase = createClientComponentClient<Database>()

  const handleRealtimeClockUpdate = useCallback(
    (payload: RealtimePostgresUpdatePayload<ClockRowData>) => {
      const newData = payload.new
      if (newData.id !== clockId) return
      if (newData !== clockData) {
        setClockData(newData)
      }
    },
    [clockId, clockData, setClockData],
  )

  const handleRealtimeClockDelete = useCallback(
    (payload: RealtimePostgresDeletePayload<ClockRowData>) => {
      if (isDeleted) return
      const deletedData = payload.old
      if (deletedData.id !== clockId) return

      // We be deleted
      setIsDeleted(true)
    },
    [clockId, isDeleted], // dependencies
  )

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
    const { error } = await deleteClockSA(objectToFormData({ clockId }))
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
  const handleStateChange = useCallback(
    (key: keyof ClockType, value: any) => {
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
    },
    [clockData],
  )

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
    const formData = objectToFormData({ clockId, newClockData })

    // Update the server
    const { error } = await updateClockDataServerAction(formData)

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
  const updatedData = useMemo(() => {
    return chartData.map((entry, index) => {
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
  }, [chartData, clockData.filled, hoveredSliceIndex])

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

  return (
    <>
      {!isDeleted && (
        <div className='flex flex-col relative items-center'>
          <h3 className='text-center'>{clockData.name}</h3>
          {configuredPieChart}
          <ClockSettingsDialog
            configuredPieChart={configuredPieChart}
            clockData={clockData}
            onStateChange={handleStateChange}
            onDelete={handleDelete}
          />
        </div>
      )}
    </>
  )
}
