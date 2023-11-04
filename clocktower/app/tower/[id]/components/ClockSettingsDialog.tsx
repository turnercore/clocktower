'use client'
import updateTowerColorsServerAction from '../actions/updateTowerColorsServerAction'
import { ClockType, ColorPaletteType, HexColorCode } from '@/types/schemas'
import React, { FC, ChangeEvent, useCallback, useMemo } from 'react'
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
import { SwatchesPicker } from '@/components/ui/color-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { LuSettings2 } from 'react-icons/lu'
import { BsTrash3Fill } from 'react-icons/bs'
import objectToFormData from '@/tools/objectToFormData'
import updateClockDataServerAction from '../actions/updateClockDataServerAction'
import deleteClockServerAction from '../actions/deleteClockServerAction'

type ClockSettingsDialogProps = {
  configuredPieChart: JSX.Element
  colorPaletteValues: Array<keyof ColorPaletteType>
  clockData: ClockType
  onStateChange: (key: keyof ClockType, value: any) => void
  onDelete: () => void
}

const ClockSettingsDialog: FC<ClockSettingsDialogProps> = ({
  configuredPieChart,
  clockData,
  colorPaletteValues,
  onStateChange,
  onDelete,
}) => {
  const dotsCss = useMemo(
    () =>
      `absolute top-[5%] right-[5%] w-[12%] h-[12%] text-gray-400 hover:text-[${clockData.color}] hover:bg-gray-200 rounded-full p-1`,
    [clockData.color],
  )

  const handleColorChange = useCallback(async (hex: HexColorCode) => {
    // Optomistic Update
    const oldColor = clockData.color
    const newColor = hex

    // Update local state
    onStateChange('color', newColor)

    // Call the server action to update the tower colors
    const response = await updateTowerColorsServerAction(
      objectToFormData({
        towerId: 'your_tower_id',
        entityId: clockData.id,
        color: hex,
      }),
    )

    if (response.error) {
      console.error('Failed to update tower colors:', response.error)
      toast({
        title: 'Failed to update tower colors',
        description: response.error,
        variant: 'destructive',
        duration: 2000,
      })
      // Revert the local state
      onStateChange('color', oldColor)
    }
  }, [])

  const handleSegmentsChange = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement> | null = null,
      segments: number | null = null,
    ) => {
      const value = event ? Number(event.target.value || event) : segments
      if (value === null || isNaN(value) || !Number.isInteger(value)) {
        return onStateChange('segments', 1)
      }

      const validValue = Math.min(Math.max(value, 1), 100) // Clamp the value between 1 and 100

      // Optimistic Update
      const oldSegmentsValue = clockData.segments // Assume clockData is accessible and holds the previous segments value
      onStateChange('segments', validValue)

      // Assume updateSegmentsServerAction is your function to update the segments on the server
      const response = await updateClockDataServerAction(
        objectToFormData({
          clockId: clockData.id,
          newClockData: {
            segments: validValue,
          },
        }),
      )

      if (response.error) {
        console.error('Failed to update segments:', response.error)
        toast({
          title: 'Failed to update segments',
          description: response.error,
          variant: 'destructive',
          duration: 2000,
        })
        // Revert to the old segments value
        onStateChange('segments', oldSegmentsValue)
      }
    },
    [],
  )

  const handleDelete = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // This might not be an optimistic update since deletion could be critical.
      // However, if you want to implement it similarly, you'd revert the delete on error.
      const response = await deleteClockServerAction(
        objectToFormData({
          clockId: clockData.id,
        }),
      )

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
    },
    [clockData.id, onDelete],
  )

  const handleNameChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newName = event.target.value
      const oldName = clockData.name

      // Optimistic Update
      onStateChange('name', newName)

      const response = await updateClockDataServerAction(
        objectToFormData({
          clockId: clockData.id,
          newClockData: {
            name: newName,
          },
        }),
      )

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
    },
    [clockData.id, clockData.name, onStateChange],
  )

  const handleIsRoundedChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newIsRounded = event.target.checked
      const oldIsRounded = clockData.rounded

      // Optimistic Update
      onStateChange('rounded', newIsRounded)

      const response = await updateClockDataServerAction(
        objectToFormData({
          clockId: clockData.id,
          newClockData: {
            rounded: newIsRounded,
          },
        }),
      )

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
    },
    [clockData.id, clockData.rounded, onStateChange],
  )

  const handleLineWidthChange = useCallback(
    async (value: number) => {
      const newLineWidth = value
      const oldLineWidth = clockData.line_width

      // Optimistic Update
      onStateChange('line_width', newLineWidth)

      const response = await updateClockDataServerAction(
        objectToFormData({
          clockId: clockData.id,
          newClockData: {
            line_width: newLineWidth,
          },
        }),
      )

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
    },
    [clockData.id, clockData.line_width, onStateChange],
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon' className={dotsCss}>
          <LuSettings2 className='w-full h-full' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className=' text-center text-2xl'>
            Clock Settings
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-row space-x-2 items-center w-full'>
          <Label> Name: </Label>
          <Input
            type='text'
            placeholder='Clock Name'
            defaultValue={clockData.name}
            onBlur={handleNameChange}
          />
        </div>
        <div className='flex flex-row'>
          <div className='w-2/3 flex flex-col items-center'>
            {configuredPieChart}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' className='w-1/2 text-center'>
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
              <Label> Segments </Label>
              <div className='flex flex-row space-x-2 items-center'>
                <Slider
                  value={[clockData.segments || 1]}
                  min={1}
                  max={30}
                  onValueCommit={(value) =>
                    handleSegmentsChange(null, value[0])
                  }
                />
              </div>
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label> Line Width </Label>
              <Slider
                defaultValue={[clockData.line_width]}
                min={1}
                max={50}
                step={1}
                onValueCommit={(value) => handleLineWidthChange(value[0])}
              />
            </div>
            <div className='flex flex-row space-x-2 items-center'>
              <Label className='flex items-center space-x-2'> Rounded </Label>
              <Input
                type='checkbox'
                checked={clockData.rounded}
                onChange={handleIsRoundedChange}
              />
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label> Color </Label>
              <SwatchesPicker
                color={clockData.color}
                onChange={handleColorChange}
                presetColors={colorPaletteValues}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClockSettingsDialog
