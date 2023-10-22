import React from 'react'
import { GiMeeple } from "react-icons/gi"
import { FaDiceD20 } from "react-icons/fa"
import { IconContext } from "react-icons"
import { Button } from '../ui'

type IconPickerProps = {
  name: string
  color: string
  color_icon: string
}

export const UserIcon: React.FC<IconPickerProps> = ({ name, color, color_icon }) => {
  let Icon
  switch (name) {
    case "D20":
      Icon = FaDiceD20
      break
    case "default":
    default:
      Icon = GiMeeple
      break
  }
  
  return (
      <IconContext.Provider value={{ color: color_icon, className: "global-class-name" }}>
        <Icon className='w-full h-full' />
      </IconContext.Provider>
  )
}
