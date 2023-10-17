import * as React from "react"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import { Button } from "./button"

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
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
