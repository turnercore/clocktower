'use client'
import React, { useEffect, useState } from 'react'
import { SwatchesPicker } from '@/components/ui/color-picker'
import { useSearchParams } from 'next/navigation'
import {
  ColorPaletteType,
  HexColorCode,
  TowerDatabaseType,
  UUID,
} from '@/types/schemas'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'
import { type RealtimePostgresUpdatePayload } from '@supabase/supabase-js'

type RealtimeColorPickerProps = {
  color: HexColorCode
  onChange: (hex: string) => void
  id?: UUID
}

const RealtimeColorPicker: React.FC<RealtimeColorPickerProps> = ({
  color,
  onChange,
  id,
}) => {
  const [colorPalette, setColorPalette] = useState<ColorPaletteType>({})
  const [currentColor, setCurrentColor] = useState<HexColorCode>(color)
  const params = useSearchParams()
  const towerId = id ? id : params.get('id')
  const supabase = createClientComponentClient<Database>()

  const handleTowerColorsUpdate = (
    payload: RealtimePostgresUpdatePayload<TowerDatabaseType>,
  ) => {
    const newData = payload.new
    if (newData.id !== towerId) return
    if (!newData.colors) return
    if (newData.colors === colorPalette) return
    setColorPalette(newData.colors)
  }

  useEffect(() => {
    if (!towerId) return

    // Fetch initial color palette
    const fetchColorPalette = async () => {
      const { data, error } = await supabase
        .from('towers')
        .select('colors')
        .eq('id', towerId)
        .single()

      if (error) {
        console.error('Error fetching color palette:', error)
        return
      }

      if (data?.colors) {
        const parsedColors = JSON.parse(data.colors as string)
        setColorPalette(parsedColors)
      }
    }

    fetchColorPalette()

    // Subscribe to color palette changes
    const subscription = supabase
      .channel(`tower_palette_updates_${towerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'towers',
          filter: `id=eq.${towerId}`,
        },
        handleTowerColorsUpdate,
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleColorChange = (color: string) => {
    if (color === currentColor) return
    // Handle local state change
    setCurrentColor(color)
    // Send it back to the clock to handle the change
    onChange(color)
  }

  const colorPaletteValues = Object.keys(colorPalette)

  return (
    <SwatchesPicker
      color={currentColor}
      onChange={handleColorChange}
      presetColors={colorPaletteValues}
    />
  )
}

export default RealtimeColorPicker
