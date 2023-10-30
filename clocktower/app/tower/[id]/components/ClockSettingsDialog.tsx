import type { ClockData, ColorPaletteItem } from '@/types'
import React, { FC, ChangeEvent, useEffect } from 'react'
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

interface ClockSettingsDialogProps {
  configuredPieChart: JSX.Element
  colorPalette: ColorPaletteItem[]
  clockData: ClockData
  handleNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleSegmentsChange: (value: number) => void
  handleIsRoundedChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleLineWidthChange: (value: number) => void
  handleColorChange: (hex: string) => void
  handleDelete: () => void
}

const ClockSettingsDialog: FC<ClockSettingsDialogProps> = ({
  configuredPieChart,
  clockData,
  colorPalette,
  handleNameChange,
  handleSegmentsChange,
  handleIsRoundedChange,
  handleLineWidthChange,
  handleColorChange,
  handleDelete,
}) => {
  const dotsCss = `absolute top-[5%] right-[5%] w-[12%] h-[12%] text-gray-400 hover:text-[${clockData.color}] hover:bg-gray-200 rounded-full p-1`
  const [segmentsValue, setSegmentsValue] = React.useState<number | null>(
    clockData.segments,
  )
  const [colorPaletteValues, setColorPaletteValues] = React.useState<string[]>(
    colorPalette.map((color) => color.hex),
  )

  // Update colorPaletteValues when colorPalette changes
  useEffect(() => {
    setColorPaletteValues(colorPalette.map((color) => color.hex))
  }, [colorPalette])

  // const modifiedPieChart = React.cloneElement(configuredPieChart, {color: localColorValue})

  const handleSegmentInputChange = (
    event: ChangeEvent<HTMLInputElement> | null = null,
    segments: number | null = null,
  ) => {
    const value = event ? Number(event.target.value || event) : segments
    if (value === null) return setSegmentsValue(null)
    // Ensure value is a number
    if (isNaN(value)) return setSegmentsValue(null)
    // Ensure value is an integer
    if (!Number.isInteger(value)) return setSegmentsValue(null)
    // Clamp value between 1 - 100
    if (value < 1) setSegmentsValue(1)
    else if (value > 100) setSegmentsValue(100)
    else setSegmentsValue(value)

    handleSegmentsChange(value)
  }

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
        {/* Name */}
        <div className='flex flex-row space-x-2 items-center w-full'>
          <label> Name: </label>
          <Input
            type='text'
            placeholder='Clock Name'
            defaultValue={clockData.name}
            onBlur={handleNameChange}
          />
        </div>
        <div className='flex flex-row'>
          {/* Current Clock */}
          <div className='w-2/3 flex flex-col items-center'>
            {configuredPieChart}
            {/* Delete Button */}
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

          {/* Settings */}
          <div className='w-1/2 flex flex-col space-y-6 mx-5'>
            {/* Number of Segments */}
            <div className='flex flex-col space-y-2 w-full'>
              <label> Segments </label>
              <div className='flex flex-row space-x-2 items-center'>
                <Slider
                  defaultValue={[segmentsValue || 1]}
                  min={1}
                  max={12}
                  onValueChange={(value) => setSegmentsValue(value[0])}
                  onValueCommit={(value) =>
                    handleSegmentInputChange(null, value[0])
                  }
                />
                <Input
                  className='max-w-[70px]'
                  type='number'
                  value={segmentsValue || undefined}
                  onChange={handleSegmentInputChange}
                />
              </div>
            </div>

            {/* Line Width */}
            <div className='flex flex-col space-y-2 w-full'>
              <label> Line Width </label>
              <Slider
                defaultValue={[clockData.line_width]}
                min={1}
                max={50}
                step={1}
                onValueCommit={(value) => handleLineWidthChange(value[0])}
              />
            </div>

            {/* Rounded Checkbox */}
            <div className='flex flex-row space-x-2 items-center'>
              <label className='flex items-center space-x-2'> Rounded </label>
              <Input
                type='checkbox'
                checked={clockData.rounded}
                onChange={handleIsRoundedChange}
              />
            </div>

            {/* Color */}
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
