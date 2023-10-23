'use client'
import React, { FC } from "react"
import { HexColorPicker } from "react-colorful"

interface SwatchesPickerProps {
  color: string
  onChange: (color: string) => void
  presetColors: string[]
}

export const SwatchesPicker: FC<SwatchesPickerProps> = ({ color, onChange, presetColors }) => {
  return (
    <div className="picker">
      <HexColorPicker color={color} onChange={onChange} />

      <div className="picker__swatches">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            className="picker__swatch"
            style={{ background: presetColor }}
            onClick={() => onChange(presetColor)}
          />
        ))}
      </div>
    </div>
  )
}
