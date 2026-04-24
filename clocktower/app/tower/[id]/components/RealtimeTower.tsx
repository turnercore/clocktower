'use client'
import {
  UUID,
  TowerRowRow,
  TowerDatabaseType,
  PresencePayload,
} from '@/types/schemas'
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, toast } from '@/components/ui'
import TowerSettingsDialog from './TowerSettingsDialog'
import { Database } from '@/types/supabase'
import { insertNewTowerRowSA } from '../actions/insertNewTowerRowSA'
import extractErrorMessage from '@/tools/extractErrorMessage'
import {
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

interface TowerProps {
  initialData: TowerDatabaseType
  children?: React.ReactNode
}

// TODO Add handling for tower deletion

const RealtimeTower: React.FC<TowerProps> = ({ initialData, children }) => {
  // Initialize state variables with initialData
  const towerId = initialData.id as UUID
  const [towerData, setTowerData] = useState<TowerDatabaseType>(initialData)
  const [addedRows, setAddedRows] = useState<TowerRowRow[]>([])
  const addedRowsRef = useRef<UUID[]>(addedRows.map((row) => row.id)) // Create a ref for addedRows
  const hasEditAccess = useEditAccess(towerId)

  const supabase = createClient()

  const handleNameChange = (newName: string) => {
    setTowerData((prevData) => ({ ...prevData, name: newName }))
  }

  const handleUsersChange = (newUsers: string[]) => {
    setTowerData((prevData) => ({ ...prevData, users: newUsers }))
  }

  // Functions to handle data changes from the server
  const handleInsertRow = (
    payload: RealtimePostgresInsertPayload<TowerRowRow>,
  ) => {
    // Check if the new row belongs to this tower
    if (
      payload.new.tower_id === towerId &&
      !addedRowsRef.current.includes(payload.new.id)
    ) {
      // Add the new row to the local state
      setAddedRows((prevRows) => {
        const updatedRows = [...prevRows, payload.new]
        // Update the ref inside the setState callback
        addedRowsRef.current = updatedRows.map((row) => row.id)
        return updatedRows
      })
    }
  }

  const handleUpdateTower = (
    payload: RealtimePostgresUpdatePayload<TowerDatabaseType>,
  ) => {
    const updatedTower = payload.new
    if (updatedTower.id !== towerId) return
    // Handle a name change
    if (updatedTower.name !== towerData.name) {
      handleNameChange(updatedTower.name)
    }

    // Handle users array change
    if (payload.new.users !== towerData.users) {
      handleUsersChange(updatedTower.users)
    }
  }

  // Subscribe to changes on mount
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
          table: 'towers',
          filter: `id=eq.${towerId}`,
        },
        handleUpdateTower,
      )
      .subscribe()

    // Cleanup function to unsubscribe from real-time updates
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, towerId])

  const handleAddRow = async () => {
    // Create a new row object with initial data
    const newRow: TowerRowRow = {
      id: crypto.randomUUID() as UUID, // Generate a unique ID for the new row
      tower_id: towerData.id, // Associate the new row with the current tower
      name: '', // Initialize name as an empty string
      position: 420 + addedRows.length, // Set the position to be at the end of the current rows array
      users: towerData.users, // Copy the users from the tower data to the new row
      color: '#FFFFFF', // Set the color to white
    }
    // Update local state optomistically
    const oldAddedRows = addedRows
    const newAddedRows = [...oldAddedRows, newRow]
    // Add the new row to the local state
    setAddedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow]
      // Update the ref inside the setState callback
      addedRowsRef.current = updatedRows.map((row) => row.id)
      return updatedRows
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
      //Revert local changes
      setAddedRows(() => {
        addedRowsRef.current = oldAddedRows.map((row) => row.id)
        return oldAddedRows
      })
    }
  }

  return (
    <TowerClockScaleProvider towerId={towerId}>
      <ClockDragProvider>
        <div className='flex flex-col space-y-4'>
          <div className='flex flex-wrap items-center justify-center gap-4 px-4'>
            <h1 className='text-3xl'>{towerData?.name}</h1>
            <TowerSettingsDialog towerData={towerData} />
            <TowerClockScaleControl />
          </div>
          <RowDragProvider>
            <div className='flex flex-col gap-4'>
              {children}
              {addedRows.map((row) => (
                <RealtimeTowerRow initialData={row} key={row.id} />
              ))}
            </div>
          </RowDragProvider>
          {hasEditAccess && (
            <Button
              onClick={handleAddRow}
              className='max-w-[250px] self-center mx-auto'
            >
              Add Row
            </Button>
          )}
        </div>
      </ClockDragProvider>
    </TowerClockScaleProvider>
  )
}

const TowerClockScaleControl = () => {
  const { clockScale, setClockScale } = useTowerClockScale()

  return (
    <div className='flex min-w-[180px] items-center gap-2 text-muted-foreground'>
      <Search className='h-4 w-4 shrink-0' aria-hidden='true' />
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
