import React, { FC, ChangeEvent } from 'react'
import { Button, Input, Slider } from "@/components/ui"
import { BlockPicker, SketchPicker } from 'react-color'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { ClockData } from '@/types'
import { LuSettings2 } from 'react-icons/lu'


interface ClockSettingsDialogProps {
  configuredPieChart: JSX.Element
  clockData: ClockData
  handleNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleSegmentsChange: (value: number) => void
  handleIsRoundedChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleLineWidthChange: (value: number) => void
  handleColorChange: (hex: string) => void
}

const ClockSettingsDialog: FC<ClockSettingsDialogProps> = ({
  configuredPieChart,
  clockData,
  handleNameChange,
  handleSegmentsChange,
  handleIsRoundedChange,
  handleLineWidthChange,
  handleColorChange,
}) => {
  const dotsCss = `absolute top-[3%] right-[5%] w-[12%] h-[12%] text-gray-400 hover:text-[${clockData.color}] hover:bg-gray-200 rounded-full p-1`
  const [segmentsValue, setSegmentsValue] = React.useState<number | null>(clockData.segments)
  const [localColorValue, setLocalColorValue] = React.useState<string | null>(clockData.color)

  // const modifiedPieChart = React.cloneElement(configuredPieChart, {color: localColorValue})

  const handleSegmentInputChange = (event: ChangeEvent<HTMLInputElement> | null = null, segments: number | null = null) => {
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
        <DialogHeader >
          <DialogTitle className=' text-center text-2xl'>Clock Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-row">
          {/* Current Clock */}
          <div className="w-2/3">
            {configuredPieChart}
          </div>

          {/* Settings */}
          <div className="w-1/2 flex flex-col space-y-6 mx-5">
            {/* Name */}
            <div className='flex flex-col space-y-2 w-full'>
              <label> Name </label>
              <Input type="text" placeholder='Clock Name' defaultValue={clockData.name} onBlur={handleNameChange} />
            </div>
            {/* Number of Segments */}
            <div className='flex flex-col space-y-2 w-full'>
              <label> Segments </label>
              <div className='flex flex-row space-x-2 items-center'>
                <Slider defaultValue={[segmentsValue || 1]} min={1} max={12} onValueChange={(value) => setSegmentsValue(value[0])} onValueCommit={(value) => handleSegmentInputChange(null, value[0])} />
                <Input className='max-w-[70px]' type="number" value={segmentsValue || undefined} defaultValue={segmentsValue || 1} onChange={handleSegmentInputChange} />
              </div>
            </div>

            {/* Line Width */}
            <div className='flex flex-col space-y-2 w-full'>
              <label> Line Width </label>
              <Slider defaultValue={[clockData.line_width]} min={1} max={50} step={1} onValueCommit={(value) => handleLineWidthChange(value[0])} />
            </div>
            {/* Rounded Checkbox */}
            <div className='flex flex-row space-x-2 items-center'>
              <label className="flex items-center space-x-2"> Rounded </label>
              <Input type="checkbox" checked={clockData.rounded} onChange={handleIsRoundedChange} />
            </div>

            {/* Color */}
            <SketchPicker
              width="100%"
              disableAlpha={true}
              color={clockData.color}
              presetColors={[clockData.color]}
              onChangeComplete={({ hex } : {hex: string}) => handleColorChange(hex)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ClockSettingsDialog
