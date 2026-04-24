'use client'
import React, { useState, useEffect, MouseEvent, Suspense, useId } from 'react'
import { PieChart } from 'react-minimal-pie-chart'
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
import {
  clockFilledDisplayValue,
  clockFilledFromInput,
  clockFilledPercentage,
} from '@/tools/clockFilled'
import { ClockSchema, ClockType, UUID } from '@/types/schemas'
import ClockSettingsDialog from './ClockSettingsDialog'
import { updateClockDataSA } from '../actions/updateClockDataSA'
import { deleteClockSA } from '../actions/deleteClockSA'
import extractErrorMessage from '@/tools/extractErrorMessage'
import useEditAccess from '@/hooks/useEditAccess'
import { useAccessibility } from '@/providers/AccessibilityProvider'
import { useClockDrag } from './ClockDragContext'
import { useTowerClockScale } from './TowerClockScaleContext'
import { useRowDrag } from './RowDragContext'

interface RealtimeClockProps {
  initialData: ClockType
}

const isAnyPopupOpen = () =>
  Boolean(
    document.querySelector(
      [
        '[role="dialog"]',
        '[role="alertdialog"]',
        '[role="menu"]',
        '[role="listbox"]',
        '[role="tooltip"]',
        '[data-radix-popper-content-wrapper]',
      ].join(','),
    ),
  )

// Define the React component
const RealtimeClock: React.FC<RealtimeClockProps> = ({ initialData }) => {
  const clockInputId = useId()
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
  const {
    draggingClockId,
    registerClockElement,
    removeClockById,
    startDrag,
    upsertClock,
  } = useClockDrag()
  const { draggingRowId } = useRowDrag()
  const { clockScale } = useTowerClockScale()
  const clockRef = React.useRef<HTMLDivElement | null>(null)
  const pendingDragRef = React.useRef<{
    pointerId: number
    startX: number
    startY: number
    started: boolean
  } | null>(null)
  const suppressNextClickRef = React.useRef(false)

  const hasEditAccess = useEditAccess(towerId)

  useEffect(() => {
    setClockData(initialData)
  }, [initialData])

  useEffect(() => {
    registerClockElement(clockId, clockRef.current)

    return () => {
      registerClockElement(clockId, null)
    }
  }, [clockId, registerClockElement])

  // Create the chart data, this is not used just to make the piechart work
  const chartData = Array.from({ length: clockData.segments }, (_, i) => ({
    title: `Segment ${i + 1}`,
    value: 10,
    color: clockData.color || '#E38627', // Green
  }))

  // Delete the clock
  const handleDelete = async () => {
    setIsDeleted(true)
    removeClockById(clockId)
    const { error } = await deleteClockSA({ clockId, towerId })
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting clock',
        description: error,
      })
      setIsDeleted(false)
      upsertClock(clockData)
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
    const filledValue = clockFilledFromInput(
      event.target.value,
      clockData.segments,
    )
    if (filledValue === null) {
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

  const handleClockPointerDown = (event: React.PointerEvent) => {
    if (!hasEditAccess || screenReaderMode || !clockRef.current) return
    if (draggingRowId) return
    if (isAnyPopupOpen()) return
    if (event.button !== 0) return

    const target = event.target as HTMLElement
    if (
      target.closest(
        'button, input, textarea, select, a, [role="button"], [data-clock-drag-ignore]',
      )
    ) {
      return
    }

    pendingDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    }

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const pendingDrag = pendingDragRef.current
      if (!pendingDrag || pendingDrag.pointerId !== moveEvent.pointerId) return

      const distanceX = moveEvent.clientX - pendingDrag.startX
      const distanceY = moveEvent.clientY - pendingDrag.startY
      const distance = Math.hypot(distanceX, distanceY)
      if (!pendingDrag.started && distance < 6) return

      moveEvent.preventDefault()
      if (pendingDrag.started || !clockRef.current) return

      pendingDragRef.current = { ...pendingDrag, started: true }
      suppressNextClickRef.current = true
      startDrag(clockData, clockRef.current, moveEvent)
    }

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (pendingDragRef.current?.pointerId !== upEvent.pointerId) return
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      pendingDragRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const screenReaderChart = (
    <Card>
      <CardHeader>
        <CardTitle>{`Clock ${clockData.name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <Label htmlFor={`clock-name-${clockInputId}`}>Clock Name</Label>
        <Input
          id={`clock-name-${clockInputId}`}
          type='text'
          value={clockData.name}
          readOnly={!hasEditAccess}
          onChange={handleNameInputChange}
        />

        <Label htmlFor={`clock-filled-${clockInputId}`}>Filled Segments</Label>
        <Input
          id={`clock-filled-${clockInputId}`}
          type='number'
          value={clockFilledDisplayValue(clockData.filled)}
          readOnly={!hasEditAccess}
          onChange={handleFilledInputChange}
        />
        <Label htmlFor={`clock-segments-${clockInputId}`}>Total Segments</Label>
        <Input
          id={`clock-segments-${clockInputId}`}
          type='number'
          value={clockData.segments}
          readOnly={!hasEditAccess}
          onChange={handleTotalSegmentsInputChange}
        />
      </CardContent>
      <CardFooter>
        <p>
          Percentage Filled:
          {clockFilledPercentage(clockData.filled, clockData.segments)}
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
        <div
          ref={clockRef}
          className={`relative flex flex-col items-center transition-transform duration-150 ${
            draggingClockId === clockId
              ? 'scale-95 opacity-30'
              : 'scale-100 opacity-100'
          } ${
            hasEditAccess && !screenReaderMode
              ? 'cursor-grab select-none touch-none active:cursor-grabbing'
              : ''
          }`}
          onClickCapture={(event) => {
            if (!suppressNextClickRef.current) return
            suppressNextClickRef.current = false
            event.preventDefault()
            event.stopPropagation()
          }}
          onPointerDown={handleClockPointerDown}
          style={!screenReaderMode ? { width: `${128 * clockScale}px` } : {}}
        >
          <div className='flex flex-row relative'>
            <div
              className='flex flex-col items-center rounded-full'
              style={{ width: `${128 * clockScale}px` }}
            >
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
