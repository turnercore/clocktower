import React, { useState, createContext, useContext } from 'react'

const AccessibilityContext = createContext({
  reduceMotion: false,
  toggleReduceMotion: () => {},
  screenReaderMode: false,
  toggleScreenReaderMode: () => {}, // Add a toggle function for screen reader mode
})

export const useAccessibility = () => useContext(AccessibilityContext)

export const AccessibilityProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [screenReaderMode, setScreenReaderMode] = useState(false)

  const toggleReduceMotion = () => {
    setReduceMotion(!reduceMotion)
  }

  const toggleScreenReaderMode = () => {
    setScreenReaderMode(!screenReaderMode)
  }

  return (
    <AccessibilityContext.Provider
      value={{
        reduceMotion,
        toggleReduceMotion,
        screenReaderMode,
        toggleScreenReaderMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}
