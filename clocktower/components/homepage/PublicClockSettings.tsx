// PublicClockSettings.tsx
'use client'
import React, { FC, ChangeEvent, useCallback } from 'react'
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
import { ColorPaletteType, HexColorCode } from '@/types/schemas'
import { PublicClockType } from './PublicClock'

type PublicClockSettingsProps = {
  pieChart: JSX.Element
  colorPalette: string[]
  clockData: PublicClockType
  onSettingsChange: (updatedClockData: Partial<PublicClockType>) => void
}

const PublicClockSettings: FC<PublicClockSettingsProps> = ({
  pieChart,
  clockData,
  colorPalette,
  onSettingsChange,
}) => {
  // All handler functions will now invoke onSettingsChange with the updated field

  const handleColorChange = (hex: HexColorCode) => {
    onSettingsChange({ color: hex })
  }

  const handleSegmentsChange = (value: number) => {
    const validValue = Math.min(Math.max(value, 1), 30) // Clamp the value between 1 and 30
    onSettingsChange({ segments: validValue })
  }

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value
    onSettingsChange({ name: newName })
  }

  const handleIsRoundedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newIsRounded = event.target.checked
    onSettingsChange({ rounded: newIsRounded })
  }

  const handleLineWidthChange = (value: number) => {
    onSettingsChange({ line_width: value })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' size='icon' className='mb-2'>
          <LuSettings2 className='w-full h-full' />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-center text-2xl'>
            Clock Settings
          </DialogTitle>
        </DialogHeader>
        <div className='flex flex-row space-x-2 items-center w-full'>
          <Label>Name:</Label>
          <Input
            type='text'
            placeholder='Clock Name'
            defaultValue={clockData.name}
            onBlur={handleNameChange} // handleNameChange is defined elsewhere to handle this event
          />
        </div>
        <div className='flex flex-row'>
          <div className='w-2/3 flex flex-col items-center'>{pieChart}</div>
          <div className='w-1/3 flex flex-col space-y-6 mx-5'>
            <div className='flex flex-col space-y-2 w-full'>
              <Label>Segments</Label>
              <Slider
                value={[clockData.segments || 1]}
                min={1}
                max={30}
                onValueChange={(value) => handleSegmentsChange(value[0])}
              />
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label>Line Width</Label>
              <Slider
                defaultValue={[clockData.line_width]}
                min={1}
                max={50}
                step={1}
                onValueChange={(value) => handleLineWidthChange(value[0])}
              />
            </div>
            <div className='flex flex-row space-x-2 items-center'>
              <Label className='flex items-center space-x-2'>Rounded</Label>
              <Input
                type='checkbox'
                checked={clockData.rounded}
                onChange={handleIsRoundedChange} // handleIsRoundedChange is defined elsewhere to handle this event
              />
            </div>
            <div className='flex flex-col space-y-2 w-full'>
              <Label>Color</Label>
              <SwatchesPicker
                color={clockData.color}
                onChange={(color) => handleColorChange(color)}
                presetColors={colorPalette}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PublicClockSettings
