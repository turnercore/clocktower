'use client'
import {
  UUID,
  TowerRowRow,
  TowerDatabaseType,
  TowerType,
  ClockType,
  TowerRowType,
} from '@/types/schemas'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, toast } from '@/components/ui'
import TowerSettingsDialog from './TowerSettingsDialog'
import { insertNewTowerRowSA } from '../actions/insertNewTowerRowSA'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js'
import RealtimeTowerRow from './RealtimeTowerRow'
import useEditAccess from '@/hooks/useEditAccess'
import { ClockDragProvider } from './ClockDragContext'
import { Search } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import {
  CLOCK_SCALE_SLIDER_MAX,
  CLOCK_SCALE_SLIDER_MIN,
  CLOCK_SCALE_SLIDER_STEP,
  clockScaleToSliderValue,
  sliderValueToClockScale,
  TowerClockScaleProvider,
  useTowerClockScale,
} from './TowerClockScaleContext'
import { RowDragProvider } from './RowDragContext'
import { TowerAccessProvider } from './TowerAccessContext'
import { useClockDrag } from './ClockDragContext'
import { useRowDrag } from './RowDragContext'

interface TowerProps {
  initialData: TowerType
}

// TODO Add handling for tower deletion

const toTowerDatabaseData = (towerData: TowerType): TowerDatabaseType => ({
  id: towerData.id,
  name: towerData.name,
  users: towerData.users,
  owner: towerData.owner,
  colors: towerData.colors,
  is_locked: towerData.is_locked,
  admin_users: towerData.admin_users,
})

const RealtimeTower: React.FC<TowerProps> = ({ initialData }) => {
  const towerId = initialData.id as UUID
  const [towerData, setTowerData] = useState<TowerDatabaseType>(
    toTowerDatabaseData(initialData),
  )
  const [rows, setRows] = useState<TowerRowType[]>(initialData.rows || [])

  return (
    <TowerAccessProvider towerData={towerData}>
      <TowerClockScaleProvider towerId={towerId}>
        <ClockDragProvider>
          <RowDragProvider>
            <RealtimeTowerContent
              rows={rows}
              setRows={setRows}
              setTowerData={setTowerData}
              towerData={towerData}
              towerId={towerId}
            />
          </RowDragProvider>
        </ClockDragProvider>
      </TowerClockScaleProvider>
    </TowerAccessProvider>
  )
}

type RealtimeTowerContentProps = {
  rows: TowerRowType[]
  setRows: React.Dispatch<React.SetStateAction<TowerRowType[]>>
  setTowerData: React.Dispatch<React.SetStateAction<TowerDatabaseType>>
  towerData: TowerDatabaseType
  towerId: UUID
}

const RealtimeTowerContent: React.FC<RealtimeTowerContentProps> = ({
  rows,
  setRows,
  setTowerData,
  towerData,
  towerId,
}) => {
  const hasEditAccess = useEditAccess(towerId)
  const { removeClockById, upsertClock } = useClockDrag()
  const { removeRowById } = useRowDrag()
  const rowIdsRef = useRef<UUID[]>(rows?.map((row) => row.id) || [])
  const supabase = createClient()

  useEffect(() => {
    rowIdsRef.current = rows?.map((row) => row.id) || []
  }, [rows])

  const handleInsertRow = useCallback(
    (payload: RealtimePostgresInsertPayload<TowerRowRow>) => {
      if (
        payload.new.tower_id === towerId &&
        !rowIdsRef.current.includes(payload.new.id)
      ) {
        setRows((prevRows) => {
          const nextRows = [
            ...(prevRows || []),
            {
              ...payload.new,
              clocks: [],
            },
          ]
          rowIdsRef.current = nextRows.map((row) => row.id)
          return nextRows
        })
      }
    },
    [setRows, towerId],
  )

  const handleUpdateRow = useCallback(
    (payload: RealtimePostgresUpdatePayload<TowerRowRow>) => {
      if (payload.new.tower_id !== towerId) return
      setRows((prevRows) =>
        (prevRows || []).map((row) =>
          row.id === payload.new.id ? { ...row, ...payload.new } : row,
        ),
      )
    },
    [setRows, towerId],
  )

  const handleDeleteRow = useCallback(
    (payload: RealtimePostgresDeletePayload<TowerRowRow>) => {
      const deletedRowId = payload.old.id as UUID | undefined
      if (!deletedRowId || !rowIdsRef.current.includes(deletedRowId)) return

      setRows((prevRows) =>
        (prevRows || []).filter((row) => row.id !== deletedRowId),
      )
      removeRowById(deletedRowId)
    },
    [removeRowById, setRows],
  )

  const handleUpdateTower = useCallback(
    (payload: RealtimePostgresUpdatePayload<TowerDatabaseType>) => {
      const updatedTower = payload.new
      if (updatedTower.id !== towerId) return
      setTowerData(updatedTower)
    },
    [setTowerData, towerId],
  )

  const handleUpsertClock = useCallback(
    (
      payload:
        | RealtimePostgresInsertPayload<ClockType>
        | RealtimePostgresUpdatePayload<ClockType>,
    ) => {
      if (payload.new.tower_id !== towerId) return
      upsertClock(payload.new)
    },
    [towerId, upsertClock],
  )

  const handleDeleteClock = useCallback(
    (payload: RealtimePostgresDeletePayload<ClockType>) => {
      const deletedClockId = payload.old.id as UUID | undefined
      if (!deletedClockId) return
      removeClockById(deletedClockId)
    },
    [removeClockById],
  )

  useEffect(() => {
    const subscription = supabase
      .channel(`tower_${towerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tower_rows',
          filter: `tower_id=eq.${towerId}`,
        },
        handleInsertRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tower_rows',
          filter: `tower_id=eq.${towerId}`,
        },
        handleUpdateRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tower_rows',
        },
        handleDeleteRow,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'towers',
          filter: `id=eq.${towerId}`,
        },
        handleUpdateTower,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clocks',
          filter: `tower_id=eq.${towerId}`,
        },
        handleUpsertClock,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clocks',
          filter: `tower_id=eq.${towerId}`,
        },
        handleUpsertClock,
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'clocks',
        },
        handleDeleteClock,
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [
    handleDeleteClock,
    handleDeleteRow,
    handleInsertRow,
    handleUpdateRow,
    handleUpdateTower,
    handleUpsertClock,
    supabase,
    towerId,
  ])

  const handleAddRow = async () => {
    // Create a new row object with initial data
    const newRow: TowerRowRow = {
      id: crypto.randomUUID() as UUID, // Generate a unique ID for the new row
      tower_id: towerData.id, // Associate the new row with the current tower
      name: '', // Initialize name as an empty string
      position: rows?.length || 0, // Set the position to be at the end of the current rows array
      users: towerData.users, // Copy the users from the tower data to the new row
      color: '#FFFFFF', // Set the color to white
    }
    // Update local state optomistically
    const oldRows = rows || []
    setRows((prevRows) => {
      const nextRows = [
        ...(prevRows || []),
        {
          ...newRow,
          clocks: [],
        },
      ]
      rowIdsRef.current = nextRows.map((row) => row.id)
      return nextRows
    })

    // Attempt to insert the new row into the server
    const { error } = await insertNewTowerRowSA(newRow)
    if (error) {
      // If there's an error, throw it to be caught in the catch block
      // If there was an error during any of the above steps, show a toast notification to inform the user
      toast({
        title: 'Failed to add new row.',
        description: extractErrorMessage(error), // Extract and show the error message from the error object
        variant: 'destructive',
      })
      setRows(() => {
        rowIdsRef.current = oldRows.map((row) => row.id)
        return oldRows
      })
    }
  }

  return (
    <div className='flex flex-col space-y-4'>
      <div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-y bg-muted/35 px-6 py-3 shadow-sm'>
        <div className='flex min-w-0 justify-start'>
          <TowerClockScaleControl />
        </div>
        <h1 className='min-w-0 truncate text-center text-3xl'>
          {towerData?.name}
        </h1>
        <div className='flex min-w-0 justify-end'>
          <TowerSettingsDialog towerData={towerData} />
        </div>
      </div>
      <div className='flex flex-col gap-4'>
        {(rows || []).map((row) => (
          <RealtimeTowerRow
            initialData={row}
            initialClocks={row.clocks}
            key={row.id}
          />
        ))}
      </div>
      {hasEditAccess && (
        <Button
          onClick={handleAddRow}
          className='max-w-[250px] self-center mx-auto'
        >
          Add Row
        </Button>
      )}
    </div>
  )
}

const TowerClockScaleControl = () => {
  const { clockScale, setClockScale } = useTowerClockScale()

  return (
    <div className='flex w-36 items-center gap-2 text-muted-foreground sm:w-44'>
      <Search className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
      <span className='sr-only' id='tower-clock-scale-label'>
        Clock scale
      </span>
      <Slider
        aria-labelledby='tower-clock-scale-label'
        value={[clockScaleToSliderValue(clockScale)]}
        min={CLOCK_SCALE_SLIDER_MIN}
        max={CLOCK_SCALE_SLIDER_MAX}
        step={CLOCK_SCALE_SLIDER_STEP}
        onValueChange={(value) =>
          setClockScale(sliderValueToClockScale(value[0]))
        }
      />
    </div>
  )
}

export default RealtimeTower
