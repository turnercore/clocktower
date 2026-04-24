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
import { TowerRowRow, UUID } from '@/types/schemas'
import { updateRowPositionSA } from '../actions/updateRowPositionSA'

type RowOrderMap = Record<UUID, TowerRowRow>

type RowDragPreview = {
  row: TowerRowRow
  width: number
  height: number
  x: number
  y: number
}

type PointerPosition = Pick<
  React.PointerEvent | PointerEvent,
  'clientX' | 'clientY'
>

type RowDragContextValue = {
  draggingRowId: UUID | null
  getRowOrder: (rowId: UUID) => number
  registerRow: (row: TowerRowRow) => void
  registerRowElement: (rowId: UUID, element: HTMLDivElement | null) => void
  removeRowById: (rowId: UUID) => void
  startRowDrag: (
    row: TowerRowRow,
    element: HTMLDivElement,
    event: PointerPosition,
  ) => void
}

const RowDragContext = createContext<RowDragContextValue | null>(null)

const sortRows = (rows: TowerRowRow[]) =>
  [...rows].sort((a, b) => a.position - b.position)

const normalizeRows = (rows: TowerRowRow[]) =>
  rows.map((row, index) => ({ ...row, position: index }))

const rowsToMap = (rows: TowerRowRow[]) =>
  rows.reduce<RowOrderMap>((accumulator, row) => {
    accumulator[row.id] = row
    return accumulator
  }, {})

const removeRow = (rows: TowerRowRow[], rowId: UUID) => {
  let removedRow: TowerRowRow | null = null
  const nextRows = rows.filter((row) => {
    if (row.id !== rowId) return true
    removedRow = row
    return false
  })

  return { nextRows, removedRow }
}

const insertRow = (rows: TowerRowRow[], row: TowerRowRow, index: number) => {
  const boundedIndex = Math.max(0, Math.min(index, rows.length))
  return [
    ...rows.slice(0, boundedIndex),
    row,
    ...rows.slice(boundedIndex),
  ]
}

export const RowDragProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [rowsById, setRowsById] = useState<RowOrderMap>({})
  const [draggingRowId, setDraggingRowId] = useState<UUID | null>(null)
  const [dragPreview, setDragPreview] = useState<RowDragPreview | null>(null)
  const rowsByIdRef = useRef<RowOrderMap>({})
  const rowElements = useRef(new Map<UUID, HTMLDivElement>())
  const lastDragTarget = useRef<number | null>(null)
  const previousBodyUserSelect = useRef<string | null>(null)

  const syncRows = useCallback((nextRowsById: RowOrderMap) => {
    rowsByIdRef.current = nextRowsById
    setRowsById(nextRowsById)
  }, [])

  const registerRow = useCallback((row: TowerRowRow) => {
    setRowsById((previousRowsById) => {
      const existingRow = previousRowsById[row.id]
      if (
        existingRow &&
        existingRow.position === row.position &&
        existingRow.name === row.name
      ) {
        return previousRowsById
      }

      const nextRowsById = {
        ...previousRowsById,
        [row.id]: row,
      }
      rowsByIdRef.current = nextRowsById
      return nextRowsById
    })
  }, [])

  const removeRowById = useCallback(
    (rowId: UUID) => {
      const nextRows = normalizeRows(
        sortRows(Object.values(rowsByIdRef.current)).filter(
          (row) => row.id !== rowId,
        ),
      )
      syncRows(rowsToMap(nextRows))
    },
    [syncRows],
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

  const getInsertionIndex = useCallback(
    (pointerY: number, draggingRowId: UUID) => {
      const visibleRows = sortRows(Object.values(rowsByIdRef.current)).filter(
        (row) => row.id !== draggingRowId,
      )
      let index = visibleRows.length

      for (let i = 0; i < visibleRows.length; i++) {
        const element = rowElements.current.get(visibleRows[i].id)
        if (!element) continue

        const rect = element.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        if (pointerY < centerY) {
          index = i
          break
        }
      }

      return index
    },
    [],
  )

  const moveDraggedRow = useCallback(
    (rowId: UUID, targetIndex: number) => {
      const orderedRows = sortRows(Object.values(rowsByIdRef.current))
      const { nextRows, removedRow } = removeRow(orderedRows, rowId)
      if (!removedRow) return

      const reorderedRows = normalizeRows(
        insertRow(nextRows, removedRow, targetIndex),
      )
      syncRows(rowsToMap(reorderedRows))
    },
    [syncRows],
  )

  const persistAffectedRows = useCallback(
    async (previousRowsById: RowOrderMap, nextRowsById: RowOrderMap) => {
      const changedRows = Object.values(nextRowsById).filter((row) => {
        const previousRow = previousRowsById[row.id]
        return !previousRow || previousRow.position !== row.position
      })

      if (changedRows.length === 0) return

      const responses = await Promise.all(
        changedRows.map((row) =>
          updateRowPositionSA({ rowId: row.id, position: row.position }),
        ),
      )

      const failedResponse = responses.find((response) => response.error)
      if (!failedResponse) return

      syncRows(previousRowsById)
      toast({
        title: 'Failed to move row',
        description: failedResponse.error,
        variant: 'destructive',
      })
    },
    [syncRows],
  )

  const startRowDrag = useCallback(
    (row: TowerRowRow, element: HTMLDivElement, event: PointerPosition) => {
      const rect = element.getBoundingClientRect()
      const previousRowsById = rowsByIdRef.current
      previousBodyUserSelect.current = document.body.style.userSelect
      document.body.style.userSelect = 'none'

      setDraggingRowId(row.id)
      setDragPreview({
        row,
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
      })
      lastDragTarget.current = row.position

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const targetIndex = getInsertionIndex(moveEvent.clientY, row.id)

        setDragPreview({
          row,
          width: rect.width,
          height: rect.height,
          x: moveEvent.clientX - (event.clientX - rect.left),
          y: moveEvent.clientY - (event.clientY - rect.top),
        })

        if (lastDragTarget.current === targetIndex) return

        lastDragTarget.current = targetIndex
        moveDraggedRow(row.id, targetIndex)
      }

      const handlePointerUp = async () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerUp)

        const nextRowsById = rowsByIdRef.current
        setDraggingRowId(null)
        setDragPreview(null)
        lastDragTarget.current = null
        document.body.style.userSelect = previousBodyUserSelect.current || ''
        previousBodyUserSelect.current = null

        await persistAffectedRows(previousRowsById, nextRowsById)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    },
    [getInsertionIndex, moveDraggedRow, persistAffectedRows],
  )

  const getRowOrder = useCallback(
    (rowId: UUID) => rowsById[rowId]?.position ?? 0,
    [rowsById],
  )

  const value = useMemo<RowDragContextValue>(
    () => ({
      draggingRowId,
      getRowOrder,
      registerRow,
      registerRowElement,
      removeRowById,
      startRowDrag,
    }),
    [
      draggingRowId,
      getRowOrder,
      registerRow,
      registerRowElement,
      removeRowById,
      startRowDrag,
    ],
  )

  return (
    <RowDragContext.Provider value={value}>
      {children}
      {dragPreview && (
        <div
          className='pointer-events-none fixed z-50 rounded-lg border bg-card/95 px-4 py-3 text-card-foreground opacity-95 shadow-xl'
          style={{
            height: dragPreview.height,
            left: dragPreview.x,
            top: dragPreview.y,
            width: dragPreview.width,
          }}
        >
          <div className='flex h-full items-center text-lg font-semibold'>
            {dragPreview.row.name || 'Untitled row'}
          </div>
        </div>
      )}
    </RowDragContext.Provider>
  )
}

export const useRowDrag = () => {
  const context = useContext(RowDragContext)
  if (!context) {
    throw new Error('useRowDrag must be used inside RowDragProvider')
  }
  return context
}
