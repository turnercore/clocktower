'use client'
import { updateTowerColorsSA } from '../actions/updateTowerColorsSA'
import { ClockType, HexColorCode } from '@/types/schemas'
import React, { FC, ChangeEvent } from 'react'
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
  Input,
  Label,
  Slider,
  toast,
} from '@/components/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BsTrash3Fill } from 'react-icons/bs'
import { updateClockDataSA } from '../actions/updateClockDataSA'
import { deleteClockSA } from '../actions/deleteClockSA'
import RealtimeColorPicker from './RealtimeColorPicker'
import { GiSettingsKnobs } from 'react-icons/gi'
import extractErrorMessage from '@/tools/extractErrorMessage'

type ClockSettingsDialogProps = {
  configuredPieChart: JSX.Element
  clockData: ClockType
  onStateChange: (key: keyof ClockType, value: any) => void
  onDelete: () => void
}

const ClockSettingsDialog: FC<ClockSettingsDialogProps> = ({
  configuredPieChart,
  clockData,
  onStateChange,
  onDelete,
}) => {
  const [segments, setSegments] = React.useState<number>(clockData.segments)

  const handleColorChange = async (color: HexColorCode) => {
    // Optomistic Update
    const oldColor = clockData.color
    const newColor = color
    try {
      // Update local state
      onStateChange('color', newColor)

      // Call the server action to update the clock color
      const { data: clockColorData, error: clockColorError } =
        await updateClockDataSA({
          clockId: clockData.id,
          newClockData: {
            color,
          },
        })

      if (clockColorError) throw clockColorError

      // Call the server action to update the tower colors)
      const { data: towerColorData, error: towerColorError } =
        await updateTowerColorsSA({
          towerId: clockData.tower_id,
          entityId: clockData.id,
          color,
        })
      if (towerColorError) throw towerColorError
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Failed to update color')
      console.error('Failed to update tower colors:', error)
      toast({
        title: 'Failed to update tower colors',
        description: errorMessage,
        variant: 'destructive',
        duration: 1000,
      })
      // Revert the local state
      onStateChange('color', oldColor)
    }
  }

  const handleSegmentsChange = async (
    event: ChangeEvent<HTMLInputElement> | null = null,
    newSegments: number | null = null,
  ) => {
    // Guard input
    const value = event ? Number(event.target.value || event) : newSegments
    if (value === null || isNaN(value) || !Number.isInteger(value)) {
      return onStateChange('segments', 1)
    }
    const validValue = Math.min(Math.max(value, 1), 100) // Clamp the value between 1 and 100

    // Optimistic Update
    const oldValue = segments
    setSegments(value)
    const oldSegmentsValue = segments
    onStateChange('segments', validValue)

    try {
      const response = await updateClockDataSA({
        clockId: clockData.id,
        newClockData: {
          segments: validValue,
        },
      })

      if (response.error) throw response.error
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        'Failed to update segments',
      )
      console.error('Failed to update segments:', errorMessage)
      toast({
        title: 'Failed to update segments',
        description: errorMessage,
        variant: 'destructive',
        duration: 2000,
      })
      // Revert to the old segments value
      onStateChange('segments', oldSegmentsValue)
      setSegments(oldValue)
    }
  }

  const handleSegmentsDrag = (value: number[]) => {
    const newSegments = value[0]
    // Guard input
    if (
      newSegments === null ||
      isNaN(newSegments) ||
      !Number.isInteger(newSegments)
    ) {
      return onStateChange('segments', 1)
    }

    const validValue = Math.min(Math.max(newSegments, 1), 100) // Clamp the value between 1 and 100

    setSegments(validValue)
  }

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // This might not be an optimistic update since deletion could be critical.
    // However, if you want to implement it similarly, you'd revert the delete on error.
    const response = await deleteClockSA({
      clockId: clockData.id,
      towerId: clockData.tower_id,
    })

    if (response.error) {
      console.error('Failed to delete:', response.error)
      toast({
        title: 'Failed to delete',
        description: response.error,
        variant: 'destructive',
        duration: 2000,
      })
      // Code to revert the deletion
    } else {
      // Successfully deleted, so we call the onDelete prop to update the parent state
      onDelete()
    }
  }

  const handleNameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value
    const oldName = clockData.name

    // Optimistic Update
    onStateChange('name', newName)

    const response = await updateClockDataSA({
      clockId: clockData.id,
      newClockData: {
        name: newName,
      },
    })

    if (response.error) {
      console.error('Failed to update name:', response.error)
      toast({
        title: 'Failed to update name',
        description: response.error,
        variant: 'destructive',
        duration: 2000,
      })
      // Revert the local state
      onStateChange('name', oldName)
    }
  }

  const handleIsRoundedChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const newIsRounded = event.target.checked
    const oldIsRounded = clockData.rounded

    // Optimistic Update
    onStateChange('rounded', newIsRounded)

    const response = await updateClockDataSA({
      clockId: clockData.id,
      newClockData: {
        rounded: newIsRounded,
      },
    })

    if (response.error) {
      console.error('Failed to update rounded setting:', response.error)
      toast({
        title: 'Failed to update rounded setting',
        description: response.error,
        variant: 'destructive',
        duration: 2000,
      })
      // Revert the local state
      onStateChange('rounded', oldIsRounded)
    }
  }

  const handleLineWidthChange = async (value: number) => {
    const newLineWidth = value
    const oldLineWidth = clockData.line_width

    // Optimistic Update
    onStateChange('line_width', newLineWidth)

    const response = await updateClockDataSA({
      clockId: clockData.id,
      newClockData: {
        line_width: newLineWidth,
      },
    })

    if (response.error) {
      console.error('Failed to update line width:', response.error)
      toast({
        title: 'Failed to update line width',
        description: response.error,
        variant: 'destructive',
        duration: 2000,
      })
      // Revert the local state
      onStateChange('line_width', oldLineWidth)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='hover:scale-105 opacity-60 hover:opacity-100'
        >
          <GiSettingsKnobs className='w-3/4 h-3/4 hover:scale-105' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className=' text-center text-2xl'>
            Clock Settings
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-row space-x-2 items-center w-full'>
          <Label> Clock Name: </Label>
          <Input
            type='text'
            placeholder='Clock Name'
            aria-label='Clock Name'
            defaultValue={clockData.name}
            onBlur={handleNameChange}
          />
        </div>
        <div className='flex flex-row'>
          <div className='w-2/3 flex flex-col items-center'>
            {configuredPieChart}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  aria-label='Delete Clock'
                  variant='destructive'
                  className='w-1/2 text-center'
                >
                  <BsTrash3Fill className='w-full h-full' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Clock?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This delete is forever, like a diamond 💎.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    aria-label='Confirm Delete Clock'
                    className='vibrating-element bg-red-500'
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className='w-1/2 flex flex-col space-y-6 mx-5'>
            <div className='flex flex-col space-y-2 w-full'>
              <Label htmlFor={`seg-slider-${clockData.id}`}>
                {' '}
                {segments} Segments{' '}
              </Label>
              <div className='flex flex-row space-x-2 items-center'>
                <Slider
                  id={`seg-slider-${clockData.id}`}
                  defaultValue={[clockData.segments]}
                  min={1}
                  max={18}
                  step={1}
                  onValueCommit={(value) =>
                    handleSegmentsChange(null, value[0])
                  }
                  onValueChange={handleSegmentsDrag}
                />
              </div>
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label htmlFor={`line-width-slider-${clockData.id}`}>
                Line Width
              </Label>
              <Slider
                id={`line-width-slider-${clockData.id}`}
                defaultValue={[clockData.line_width]}
                min={1}
                max={50}
                step={1}
                onValueCommit={(value) => handleLineWidthChange(value[0])}
              />
            </div>
            <div className='flex flex-row space-x-2 items-center'>
              <Label
                htmlFor={`rounded-slider-${clockData.id}`}
                className='flex items-center space-x-2'
              >
                Rounded Clock
              </Label>
              <Input
                id={`rounded-slider-${clockData.id}`}
                type='checkbox'
                checked={clockData.rounded}
                onChange={handleIsRoundedChange}
              />
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label htmlFor={`color-picker-${clockData.id}`}> Color </Label>
              <RealtimeColorPicker
                id={`color-picker-${clockData.id}`}
                color={clockData.color}
                onChange={handleColorChange}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClockSettingsDialog
