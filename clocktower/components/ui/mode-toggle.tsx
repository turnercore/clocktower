import * as React from "react"
import { TbMoonStars } from "react-icons/tb"
import { GiMoonBats } from "react-icons/gi"
import { BsSunglasses } from "react-icons/bs"
import { useTheme } from "next-themes"
import { Button } from "./button"
import { TbSunHigh } from "react-icons/tb"

export function ModeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()

  // Function to toggle theme between light and dark
  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light")
    } else {
      setTheme("dark")
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={className}
      onClick={toggleTheme}
    >
      {/* Show Sun icon if theme is light, otherwise show Moon icon */}
      {resolvedTheme !== "dark" ? (
        <TbSunHigh className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <GiMoonBats className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
