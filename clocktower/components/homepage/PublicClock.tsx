//PublicClock.tsx
'use client'
import React, { useState, useEffect, MouseEvent, useMemo } from 'react'
import { PieChart } from 'react-minimal-pie-chart'
import { lightenHexColor, darkenHexColor } from '@/tools/changeHexColors'
import PublicClockSettings from './PublicClockSettings'
import { ClockSchema, ClockType, ColorPaletteType } from '@/types/schemas'

export type PublicClockType = Omit<
  ClockType,
  'users' | 'id' | 'tower_id' | 'row_id' | 'position'
>

//Array of hex values to make a nice color pallete with lots of options to choose from
const colorPalette = [
  '#FFC312',
  '#C4E538',
  '#12CBC4',
  '#FDA7DF',
  '#ED4C67',
  '#F79F1F',
  '#A3CB38',
  '#1289A7',
  '#D980FA',
  '#B53471',
]

const randomClockNames = [
  'Quest Progress',
  'Battle Outcome Countdown',
  'Enemy Forces Arrival',
  'Treasure Discovery Timer',
  'Political Alliance Tracker',
  'Mystery Resolution Timer',
  'Escape Deadline',
  'Rebellion Success Meter',
  'Peace Treaty Negotiation',
  'Secret Mission Timer',
  'Dungeon Exploration Tracker',
  'Ritual Completion Countdown',
  'Rescue Mission Clock',
  'Siege Breakthrough Timer',
  'Magic Storm Approach',
  'Evil Plan Thwarting',
  'Invasion Defense Timer',
  'Curse Reversal Countdown',
  'Monster Hunt Tracker',
  'Legendary Weapon Forge',
  'Tea Time Tension Tracker',
  'Duckling Rescue Countdown',
  'Potion Brewing Boil-Over',
  'Mischievous Imps Mischief Meter',
  'Cake Baking Battle Timer',
  'Dance-Off Showdown Stopwatch',
  'Napping Dragon Wake-Up Timer',
  'Pirate Parley Pantomime',
  'Magical Muffin Manifestation Moment',
  "Wizard's Beard Growth Gauge",
  'Chaos Cupcake Countdown',
  'Wizardly Wardrobe Malfunction',
  'Sneaky Squirrel Heist Timer',
  'Goblin Dance Party Deadline',
  'Puddle-Jumping Contest Clock',
  'Broomstick Barrel Roll Rally',
  'Pixie Prank Pandemonium Period',
  'Unicorn Racing Roundup',
  'Gargantuan Gelatinous Cube Dissolve',
  'Frog Choir Croak-a-long Timer',
  'Troll Bridge Toll Time',
  'Jester Joke-Off Jam Timer',
  "Ogre's Onion Cooking Contest",
  'Dragon Egg Hatching Hourglass',
  'Fairy Flash Mob Countdown',
  'Leprechaun Gold Hunt Hour',
  'Mermaid Splash-Off Schedule',
  'Yeti Yodeling Marathon Meter',
  'Cursed Cutlery Collection Countdown',
  'Gnome Home Dome Construction Clock',
]

const defaultClockData: PublicClockType = {
  // Provide default values for the offline clock
  name: 'Loading Clock',
  segments: 4, // Random Number between 2 and 10
  color: '#99D5C9',
  filled: 2,
  rounded: false,
  line_width: 20,
  lighten_intensity: 0.2,
  darken_intensity: 0.2,
}

const PublicClock: React.FC = () => {
  // Create state variables
  const [clockData, setClockData] = useState<PublicClockType>(defaultClockData)
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(
    null,
  )

  useEffect(() => {
    const randomSegements = Math.floor(Math.random() * 10) + 2 // Random Number between 2 and 10
    const randomName =
      randomClockNames[Math.floor(Math.random() * randomClockNames.length)]
    const randomColorFromPalette =
      colorPalette[Math.floor(Math.random() * colorPalette.length)]

    setClockData((prevState) => ({
      ...prevState,
      name: randomName,
      segments: randomSegements,
      filled: Math.floor((Math.random() * randomSegements) / 2),
    }))
  }, [])

  // Create the chart data
  const chartData = useMemo(() => {
    return Array.from({ length: clockData.segments }, (_, i) => ({
      title: `Segment ${i + 1}`,
      value: 10,
      color: clockData.color, // Default color
    }))
  }, [clockData.segments, clockData.color])

  // This one actually updates the server
  const handleSliceClick = (event: MouseEvent, dataIndex: number) => {
    let newFilledValue: number | null

    if (
      clockData.filled === dataIndex ||
      (clockData.filled !== null && dataIndex < clockData.filled)
    ) {
      newFilledValue = dataIndex === 0 ? null : dataIndex - 1
    } else {
      newFilledValue = dataIndex
    }

    // update local state
    setClockData((prevState) => ({
      ...prevState,
      filled: newFilledValue,
    }))
  }

  // Handle mouse over slice
  const handleMouseOver = (event: MouseEvent, dataIndex: number) => {
    setHoveredSliceIndex(dataIndex)
  }

  // Handle mouse out of slice
  const handleMouseOut = () => {
    setHoveredSliceIndex(null)
  }

  const updatedData = useMemo(() => {
    return chartData.map((entry, index) => {
      let fillColor = 'gray' // Default color for non-active slices

      // Logic for selected slices
      if (clockData.filled !== null && index <= clockData.filled) {
        fillColor = entry.color // Original color for selected slices
      }

      // Trailing Hover Effect
      if (hoveredSliceIndex !== null && index < hoveredSliceIndex) {
        // Apply lighten effect if the segment is not filled
        if (clockData.filled === null || index > clockData.filled) {
          fillColor = lightenHexColor(entry.color, clockData.lighten_intensity)
        }
      }

      // Leading Hover Effect
      if (
        hoveredSliceIndex !== null &&
        index >= hoveredSliceIndex &&
        clockData.filled !== null &&
        index <= clockData.filled
      ) {
        fillColor = darkenHexColor(entry.color, clockData.darken_intensity)
      }

      // Logic for hovered slices
      if (hoveredSliceIndex === index) {
        if (clockData.filled !== null && index <= clockData.filled) {
          fillColor = darkenHexColor(entry.color, clockData.darken_intensity)
        } else {
          fillColor = lightenHexColor(entry.color, clockData.lighten_intensity)
        }
      }

      return {
        ...entry,
        color: fillColor,
      }
    })
  }, [chartData, clockData.filled, hoveredSliceIndex])

  // Handle changes from settings component
  const handleDataChange = (clockData: Partial<PublicClockType>) => {
    try {
      setClockData((prevState) => ({
        ...prevState, // Spread in the previous state
        ...clockData, // Spread in the updated values
      }))
    } catch (error) {
      console.error(error)
    }
  }

  const pieChart = (
    <PieChart
      data={updatedData}
      lineWidth={
        clockData.rounded ? clockData.line_width / 2 : clockData.line_width
      } // Custom arc's width for the Donut chart
      paddingAngle={
        clockData.rounded ? clockData.line_width : clockData.line_width / 4
      } // Padding between arcs
      rounded={clockData.rounded ? true : false}
      startAngle={-90} // Start from the top-right
      segmentsStyle={{ transition: 'stroke .3s', cursor: 'pointer' }}
      segmentsShift={(index: number) =>
        index === hoveredSliceIndex ? 0.5 : -0.5
      } // Slight grow on hover
      onClick={handleSliceClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      viewBoxSize={[110, 110]} // Increase the viewbox dimensions
      center={[55, 55]} // Move the center of the chart
    />
  )

  return (
    <>
      {pieChart}

      <div className='flex flex-col'>
        <div className='flex flex-row items-center space-x-2 w-full'>
          <h2 className='text-2xl tracking-wide leading-tight font-thin'>
            {clockData.name}
          </h2>
          <PublicClockSettings
            clockData={clockData}
            colorPalette={colorPalette}
            onSettingsChange={handleDataChange}
            pieChart={pieChart}
          />
        </div>
      </div>
      <span className='text-sm mt-6'>(Yes, they sync in realtime)</span>
    </>
  )
}

export default PublicClock
