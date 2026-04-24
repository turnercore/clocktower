'use client'

import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { UUID } from '@/types/schemas'

export const DEFAULT_CLOCK_SCALE = 1
export const MIN_CLOCK_SCALE = 0.5
export const MAX_CLOCK_SCALE = 2
export const CLOCK_SCALE_SLIDER_MIN = 0
export const CLOCK_SCALE_SLIDER_MAX = 100
export const CLOCK_SCALE_SLIDER_CENTER = 50
export const CLOCK_SCALE_SLIDER_STEP = 1

type TowerClockScaleContextValue = {
  clockScale: number
  setClockScale: (scale: number) => void
}

const TowerClockScaleContext =
  createContext<TowerClockScaleContextValue | null>(null)

const storageKeyForTower = (towerId: UUID) =>
  `clocktower:tower-clock-scale:${towerId}`

const clampClockScale = (scale: number) =>
  Math.min(Math.max(scale, MIN_CLOCK_SCALE), MAX_CLOCK_SCALE)

export const clockScaleToSliderValue = (scale: number) => {
  const clampedScale = clampClockScale(scale)

  if (clampedScale <= DEFAULT_CLOCK_SCALE) {
    return (
      ((clampedScale - MIN_CLOCK_SCALE) /
        (DEFAULT_CLOCK_SCALE - MIN_CLOCK_SCALE)) *
      CLOCK_SCALE_SLIDER_CENTER
    )
  }

  return (
    CLOCK_SCALE_SLIDER_CENTER +
    ((clampedScale - DEFAULT_CLOCK_SCALE) /
      (MAX_CLOCK_SCALE - DEFAULT_CLOCK_SCALE)) *
      CLOCK_SCALE_SLIDER_CENTER
  )
}

export const sliderValueToClockScale = (sliderValue: number) => {
  const clampedValue = Math.min(
    Math.max(sliderValue, CLOCK_SCALE_SLIDER_MIN),
    CLOCK_SCALE_SLIDER_MAX,
  )

  if (clampedValue <= CLOCK_SCALE_SLIDER_CENTER) {
    return clampClockScale(
      MIN_CLOCK_SCALE +
        (clampedValue / CLOCK_SCALE_SLIDER_CENTER) *
          (DEFAULT_CLOCK_SCALE - MIN_CLOCK_SCALE),
    )
  }

  return clampClockScale(
    DEFAULT_CLOCK_SCALE +
      ((clampedValue - CLOCK_SCALE_SLIDER_CENTER) /
        CLOCK_SCALE_SLIDER_CENTER) *
        (MAX_CLOCK_SCALE - DEFAULT_CLOCK_SCALE),
  )
}

type TowerClockScaleProviderProps = {
  towerId: UUID
  children: React.ReactNode
}

export const TowerClockScaleProvider: React.FC<
  TowerClockScaleProviderProps
> = ({ towerId, children }) => {
  const [clockScale, setClockScaleState] = useState(DEFAULT_CLOCK_SCALE)

  useEffect(() => {
    queueMicrotask(() => {
      const storedScale = window.localStorage.getItem(
        storageKeyForTower(towerId),
      )
      if (!storedScale) {
        setClockScaleState(DEFAULT_CLOCK_SCALE)
        return
      }

      const parsedScale = Number(storedScale)
      if (Number.isFinite(parsedScale)) {
        setClockScaleState(clampClockScale(parsedScale))
      }
    })
  }, [towerId])

  const setClockScale = useCallback((scale: number) => {
    const nextScale = clampClockScale(scale)
    setClockScaleState(nextScale)
    window.localStorage.setItem(storageKeyForTower(towerId), String(nextScale))
  }, [towerId])

  const value = useMemo(
    () => ({ clockScale, setClockScale }),
    [clockScale, setClockScale],
  )

  return (
    <TowerClockScaleContext.Provider value={value}>
      {children}
    </TowerClockScaleContext.Provider>
  )
}

export const useTowerClockScale = () => {
  const context = useContext(TowerClockScaleContext)
  if (!context) {
    throw new Error(
      'useTowerClockScale must be used within a TowerClockScaleProvider',
    )
  }

  return context
}
