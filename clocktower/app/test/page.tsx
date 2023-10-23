'use client'
import { SwatchesPicker } from '@/components/ui/color-picker'
import React from 'react'

const Page = () => {
  const presetColors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#c0c0c0', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#ff6666', '#ffff66', '#66ff66', '#66ffff', '#6666ff', '#ff66ff', '#bfbfbf', '#a6a6a6', '#8c8c8c', '#737373']
  return (
    <div className='flex flex-col items-center mx-auto'>
      <SwatchesPicker color='#000000' onChange={() => {}} presetColors={presetColors} />
    </div>
    
  )
}

export default Page
