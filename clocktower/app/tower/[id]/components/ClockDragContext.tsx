'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from '@/components/ui'
import { ClockType, UUID } from '@/types/schemas'
import { updateClockDataSA } from '../actions/updateClockDataSA'
import { PieChart } from 'react-minimal-pie-chart'

type RowClockMap = Record<UUID, ClockType[]>

type DragPreview = {
  clock: ClockType
  width: number
  height: number
  x: number
  y: number
}

type DragState = {
  clockId: UUID
}

type PointerPosition = Pick<
  React.PointerEvent | PointerEvent,
  'clientX' | 'clientY'
>

type ClockDragContextValue = {
  draggingClockId: UUID | null
  dragPreview: DragPreview | null
  getRowClocks: (rowId: UUID) => ClockType[]
  registerClockElement: (clockId: UUID, element: HTMLDivElement | null) => void
  registerRow: (rowId: UUID, initialClocks: ClockType[]) => void
  registerRowElement: (rowId: UUID, element: HTMLDivElement | null) => void
  removeClockById: (clockId: UUID) => void
  startDrag: (
    clock: ClockType,
    element: HTMLDivElement,
    event: PointerPosition,
  ) => void
  upsertClock: (clock: ClockType) => void
}

const ClockDragContext = createContext<ClockDragContextValue | null>(null)

const sortClocks = (clocks: ClockType[]) =>
  [...clocks].sort((a, b) => a.position - b.position)

const removeClock = (rows: RowClockMap, clockId: UUID) => {
  const nextRows: RowClockMap = {}
  let removedClock: ClockType | null = null

  Object.entries(rows).forEach(([rowId, clocks]) => {
    nextRows[rowId as UUID] = clocks.filter((clock) => {
      if (clock.id !== clockId) return true
      removedClock = clock
      return false
    })
  })

  return { nextRows, removedClock }
}

const insertClock = (
  rows: RowClockMap,
  rowId: UUID,
  index: number,
  clock: ClockType,
) => {
  const rowClocks = rows[rowId] || []
  const boundedIndex = Math.max(0, Math.min(index, rowClocks.length))
  const nextClock = { ...clock, row_id: rowId, position: boundedIndex }

  return {
    ...rows,
    [rowId]: [
      ...rowClocks.slice(0, boundedIndex),
      nextClock,
      ...rowClocks.slice(boundedIndex),
    ],
  }
}

const normalizeRowPositions = (rows: RowClockMap) => {
  const normalized: RowClockMap = {}
  Object.entries(rows).forEach(([rowId, clocks]) => {
    normalized[rowId as UUID] = clocks.map((clock, index) => ({
      ...clock,
      row_id: rowId as UUID,
      position: index,
    }))
  })
  return normalized
}

export const ClockDragProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [rowClocks, setRowClocks] = useState<RowClockMap>({})
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const rowElements = useRef(new Map<UUID, HTMLDivElement>())
  const clockElements = useRef(new Map<UUID, HTMLDivElement>())
  const rowClocksRef = useRef<RowClockMap>({})
  const lastDragTarget = useRef<{ rowId: UUID; index: number } | null>(null)

  const syncRowClocks = useCallback((nextRows: RowClockMap) => {
    rowClocksRef.current = nextRows
    setRowClocks(nextRows)
  }, [])

  const getInsertionTarget = useCallback(
    (pointerX: number, pointerY: number, draggingClockId: UUID) => {
      let activeRowId: UUID | null = null

      rowElements.current.forEach((element, rowId) => {
        const rect = element.getBoundingClientRect()
        if (
          pointerY >= rect.top &&
          pointerY <= rect.bottom &&
          pointerX >= rect.left &&
          pointerX <= rect.right
        ) {
          activeRowId = rowId
        }
      })

      if (!activeRowId) {
        let nearestDistance = Number.POSITIVE_INFINITY
        rowElements.current.forEach((element, rowId) => {
          const rect = element.getBoundingClientRect()
          const centerY = rect.top + rect.height / 2
          const distance = Math.abs(pointerY - centerY)
          if (distance < nearestDistance) {
            nearestDistance = distance
            activeRowId = rowId
          }
        })
      }

      if (!activeRowId) return null

      const clocksInRow = rowClocksRef.current[activeRowId] || []
      const visibleClocks = clocksInRow.filter(
        (clock) => clock.id !== draggingClockId,
      )
      let index = visibleClocks.length

      for (let i = 0; i < visibleClocks.length; i++) {
        const element = clockElements.current.get(visibleClocks[i].id)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        if (
          pointerY < centerY ||
          (Math.abs(pointerY - centerY) < 24 && pointerX < centerX)
        ) {
          index = i
          break
        }
      }

      return { rowId: activeRowId, index }
    },
    [],
  )

  const moveDraggedClock = useCallback(
    (clockId: UUID, targetRowId: UUID, targetIndex: number) => {
      const { nextRows, removedClock } = removeClock(
        rowClocksRef.current,
        clockId,
      )
      if (!removedClock) return

      const nextRowClocks = normalizeRowPositions(
        insertClock(nextRows, targetRowId, targetIndex, removedClock),
      )

      syncRowClocks(nextRowClocks)
    },
    [syncRowClocks],
  )

  const persistAffectedRows = useCallback(
    async (previousRows: RowClockMap, nextRows: RowClockMap) => {
      const changedClocks = Object.values(nextRows)
        .flat()
        .filter((clock) => {
          const previousClock = Object.values(previousRows)
            .flat()
            .find((candidate) => candidate.id === clock.id)

          return (
            !previousClock ||
            previousClock.row_id !== clock.row_id ||
            previousClock.position !== clock.position
          )
        })

      if (changedClocks.length === 0) return

      const responses = await Promise.all(
        changedClocks.map((clock) =>
          updateClockDataSA({
            clockId: clock.id,
            newClockData: {
              row_id: clock.row_id,
              position: clock.position,
            },
          }),
        ),
      )

      const failedResponse = responses.find((response) => response.error)
      if (!failedResponse) return

      syncRowClocks(previousRows)
      toast({
        title: 'Failed to move clock',
        description: failedResponse.error,
        variant: 'destructive',
      })
    },
    [syncRowClocks],
  )

  const registerRow = useCallback(
    (rowId: UUID, initialClocks: ClockType[]) => {
      setRowClocks((previousRows) => {
        if (previousRows[rowId]) return previousRows

        const nextRows = {
          ...previousRows,
          [rowId]: sortClocks(initialClocks),
        }
        rowClocksRef.current = nextRows
        return nextRows
      })
    },
    [],
  )

  const registerRowElement = useCallback(
    (rowId: UUID, element: HTMLDivElement | null) => {
      if (element) {
        rowElements.current.set(rowId, element)
        return
      }
      rowElements.current.delete(rowId)
    },
    [],
  )

  const registerClockElement = useCallback(
    (clockId: UUID, element: HTMLDivElement | null) => {
      if (element) {
        clockElements.current.set(clockId, element)
        return
      }
      clockElements.current.delete(clockId)
    },
    [],
  )

  const getRowClocks = useCallback(
    (rowId: UUID) => rowClocks[rowId] || [],
    [rowClocks],
  )

  const upsertClock = useCallback(
    (clock: ClockType) => {
      const existingClock = Object.values(rowClocksRef.current)
        .flat()
        .find((candidate) => candidate.id === clock.id)

      if (
        existingClock &&
        existingClock.position === clock.position &&
        existingClock.row_id === clock.row_id
      ) {
        return
      }

      const { nextRows } = removeClock(rowClocksRef.current, clock.id)
      const nextRowClocks = normalizeRowPositions(
        insertClock(nextRows, clock.row_id, clock.position, clock),
      )
      syncRowClocks(nextRowClocks)
    },
    [syncRowClocks],
  )

  const removeClockById = useCallback(
    (clockId: UUID) => {
      const { nextRows } = removeClock(rowClocksRef.current, clockId)
      syncRowClocks(normalizeRowPositions(nextRows))
    },
    [syncRowClocks],
  )

  const startDrag = useCallback(
    (clock: ClockType, element: HTMLDivElement, event: PointerPosition) => {
      const rect = element.getBoundingClientRect()
      const previousRows = rowClocksRef.current

      setDragState({ clockId: clock.id })
      setDragPreview({
        clock,
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
      })
      lastDragTarget.current = {
        rowId: clock.row_id,
        index: clock.position,
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const target = getInsertionTarget(
          moveEvent.clientX,
          moveEvent.clientY,
          clock.id,
        )

        setDragPreview({
          clock,
          width: rect.width,
          height: rect.height,
          x: moveEvent.clientX - (event.clientX - rect.left),
          y: moveEvent.clientY - (event.clientY - rect.top),
        })

        if (!target) return
        if (
          lastDragTarget.current?.rowId === target.rowId &&
          lastDragTarget.current.index === target.index
        ) {
          return
        }

        lastDragTarget.current = target
        moveDraggedClock(clock.id, target.rowId, target.index)
      }

      const handlePointerUp = async () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)

        const nextRows = rowClocksRef.current
        setDragState(null)
        setDragPreview(null)
        lastDragTarget.current = null

        await persistAffectedRows(previousRows, nextRows)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [getInsertionTarget, moveDraggedClock, persistAffectedRows],
  )

  const value = useMemo<ClockDragContextValue>(
    () => ({
      draggingClockId: dragState?.clockId || null,
      dragPreview,
      getRowClocks,
      registerClockElement,
      registerRow,
      registerRowElement,
      removeClockById,
      startDrag,
      upsertClock,
    }),
    [
      dragPreview,
      dragState?.clockId,
      getRowClocks,
      registerClockElement,
      registerRow,
      registerRowElement,
      removeClockById,
      startDrag,
      upsertClock,
    ],
  )

  return (
    <ClockDragContext.Provider value={value}>
      {children}
      {dragPreview && (
        <div
          className='pointer-events-none fixed z-50 opacity-95 drop-shadow-xl'
          style={{
            height: dragPreview.height,
            left: dragPreview.x,
            top: dragPreview.y,
            width: dragPreview.width,
          }}
        >
          <div className='scale-105 rounded-md bg-background/95 p-1 shadow-lg'>
            <ClockDragPreview clock={dragPreview.clock} />
          </div>
        </div>
      )}
    </ClockDragContext.Provider>
  )
}

const ClockDragPreview = ({ clock }: { clock: ClockType }) => {
  const chartData = Array.from({ length: clock.segments }, (_, index) => ({
    title: `Segment ${index + 1}`,
    value: 10,
    color:
      clock.filled !== null && index <= clock.filled
        ? clock.color || '#E38627'
        : 'gray',
  }))

  return (
    <div className='flex flex-col items-center'>
      <div className='h-[110px] w-[110px]'>
        <PieChart
          data={chartData}
          lineWidth={clock.rounded ? clock.line_width / 2 : clock.line_width}
          paddingAngle={
            clock.rounded ? clock.line_width : clock.line_width / 4
          }
          rounded={clock.rounded}
          startAngle={-90}
          viewBoxSize={[110, 110]}
          center={[55, 55]}
        />
      </div>
      <h2 className='mt-1 text-xl font-thin text-center'>{clock.name}</h2>
    </div>
  )
}

export const useClockDrag = () => {
  const context = useContext(ClockDragContext)
  if (!context) {
    throw new Error('useClockDrag must be used inside ClockDragProvider')
  }
  return context
}
