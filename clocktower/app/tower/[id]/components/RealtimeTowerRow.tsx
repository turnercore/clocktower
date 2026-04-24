'use client'
import React, { useState, useEffect, Suspense } from 'react'
import RealtimeClock from './RealtimeClock'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  ScrollArea,
  ScrollBar,
  toast,
} from '@/components/ui'
import { TbClockPlus } from 'react-icons/tb'
import { UUID, ClockType, TowerRowRow } from '@/types/schemas'
import { TiDelete } from 'react-icons/ti'
import insertNewClockSA from '../actions/insertNewClockSA'
import { updateRowNameSA } from '../actions/updateRowNameSA'
import { deleteTowerRowSA } from '../actions/deleteTowerRowSA'
import useEditAccess from '@/hooks/useEditAccess'
import { useAccessibility } from '@/providers/AccessibilityProvider'
import { useClockDrag } from './ClockDragContext'
import { GripVertical } from 'lucide-react'
import { useRowDrag } from './RowDragContext'

type RealtimeTowerRowProps = {
  initialData: TowerRowRow
  initialClocks?: ClockType[]
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

const RealtimeTowerRow: React.FC<RealtimeTowerRowProps> = ({
  initialData,
  initialClocks = [],
}) => {
  const rowId = initialData.id
  const towerId = initialData.tower_id
  const [rowData, setRowData] = useState<TowerRowRow>(initialData)
  const [rowName, setRowName] = useState<string>(initialData.name || '')
  const [isDeleted, setIsDeleted] = useState<boolean>(false)
  const hasEditAccess = useEditAccess(towerId)
  const { reduceMotion, screenReaderMode } = useAccessibility()
  const {
    draggingClockId,
    getRowClocks,
    registerRow,
    registerRowElement,
    removeClockById,
    upsertClock,
  } = useClockDrag()
  const {
    draggingRowId,
    getRowOrder,
    registerRow: registerDraggableRow,
    registerRowElement: registerDraggableRowElement,
    removeRowById,
    startRowDrag,
  } = useRowDrag()
  const rowCardRef = React.useRef<HTMLDivElement | null>(null)
  const rowClocks = getRowClocks(rowId)

  useEffect(() => {
    setRowData(initialData)
    setRowName(initialData.name || '')
  }, [initialData])

  useEffect(() => {
    registerRow(rowId, initialClocks)
  }, [initialClocks, registerRow, rowId])

  useEffect(() => {
    registerDraggableRow(rowData)
  }, [registerDraggableRow, rowData])

  const addClock = async () => {
    // Define default Clock
    const newClock: ClockType = {
      id: crypto.randomUUID() as UUID,
      position: rowClocks.length,
      name: '',
      segments: 6,
      row_id: rowId,
      tower_id: towerId,
      users: rowData.users || [],
      filled: null,
      rounded: false,
      line_width: 20,
      lighten_intensity: 0.35,
      darken_intensity: 0.5,
      color: '#E38627', // Default color, this should probably be a const or random from a palette
    }

    upsertClock(newClock)

    // Update the server
    const { error } = await insertNewClockSA(newClock)

    if (error) {
      console.error('Error adding clock:', error)
      removeClockById(newClock.id)
    }
  }

  // Update the Row's name on the server and local states
  const handleRowNameChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newRowName = event.target.value
    // Make sure newRowName is less than 30 characters
    if (newRowName.length > 30) {
      setRowName('')
      toast({
        variant: 'destructive',
        title: 'Error updating row name',
        description: 'Row name must be less than 30 characters.',
      })
      return
    }
    // Get old row name
    const oldRowName = rowName
    // Update local state
    setRowName(event.target.value)
    // Update the server
    const { error } = await updateRowNameSA(rowId, newRowName)
    // Handle Errors
    if (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Error updating row name',
        description: error,
      })
      // Revert if error
      setRowName(oldRowName)
      setRowData((previousRowData) => ({
        ...previousRowData,
        name: oldRowName,
        position: getRowOrder(rowId),
      }))
      return
    }
    setRowData((previousRowData) => ({
      ...previousRowData,
      name: newRowName,
      position: getRowOrder(rowId),
    }))
  }

  // Update the server and delete the row
  const handleRowDelete = async () => {
    // Update local state
    setIsDeleted(true)
    removeRowById(rowId)
    // Delete from the server
    const { error } = await deleteTowerRowSA({ rowId, towerId })
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting row',
        description: error,
      })
      setIsDeleted(false)
      registerDraggableRow(rowData)
      return
    }
  }

  const handleRowDragPointerDown = (event: React.PointerEvent) => {
    if (draggingClockId) return
    if (isAnyPopupOpen()) return

    event.preventDefault()
    event.stopPropagation()
    if (!rowCardRef.current) return

    startRowDrag(rowData, rowCardRef.current, event)
  }

  return (
    <Suspense>
      {!isDeleted && (
        <Card
          ref={(element) => {
            rowCardRef.current = element
            registerDraggableRowElement(rowId, element)
          }}
          className={`flex flex-col space-y-2 mr-10 ml-2 transition-opacity ${
            draggingRowId === rowId ? 'opacity-30' : 'opacity-100'
          }`}
          style={{ order: getRowOrder(rowId) }}
        >
          {/* Row Name and Settings*/}
          <CardTitle className='flex flex-row space-x-2 space-y-2 items-center mx-8 mt-3'>
            {hasEditAccess && !screenReaderMode && (
              <Button
                aria-label={`Move row ${rowName || 'untitled'}`}
                className='mt-2 h-9 w-9 touch-none'
                variant='outline'
                size='icon'
                onPointerDown={handleRowDragPointerDown}
              >
                <GripVertical className='h-4 w-4' aria-hidden='true' />
              </Button>
            )}
            {hasEditAccess ? (
              <Input
                name='rowName'
                className='w-[200px] mt-2'
                placeholder='Row'
                defaultValue={rowName}
                onBlur={handleRowNameChange}
              />
            ) : (
              <p>{rowName}</p>
            )}
            {hasEditAccess && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    aria-label='Delete Row Confirmation Dialog'
                    variant='outline'
                  >
                    <TiDelete className='w-full h-full' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Row{rowName ? ' ' + rowName : ''}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete the row and all clocks contained within.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {reduceMotion ? (
                      <AlertDialogAction
                        className=' bg-red-500'
                        onClick={handleRowDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    ) : (
                      <AlertDialogAction
                        className='vibrating-element bg-red-500'
                        onClick={handleRowDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardTitle>
          <CardContent>
            <div
              ref={(element) => registerRowElement(rowId, element)}
              className='flex min-h-32 flex-wrap items-center gap-4'
            >
              {rowClocks.map((clock) => (
                <RealtimeClock key={clock.id} initialData={clock} />
              ))}
              {hasEditAccess && (
                <Button
                  variant='ghost'
                  className='h-24 w-24'
                  onClick={addClock}
                  aria-label='Add Clock'
                >
                  <TbClockPlus className='ml-1 h-8 w-8' />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Suspense>
  )
}

export default RealtimeTowerRow
