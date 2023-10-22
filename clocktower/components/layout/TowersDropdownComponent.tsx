"use client"
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/tools/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { isValidUUID } from "@/tools/isValidUUID"
import { UUID } from "@/types"
import { useParams, useRouter } from "next/navigation"
import { GiWhiteTower } from "react-icons/gi"

export function TowersDropdownComponent({ towers }: { towers: any[] }) {
  const router = useRouter()
  const params = useParams()
  const selectedTowerName = towers.find((tower) => tower.id === params.id)?.name || ""
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(selectedTowerName)

  const navigateToSelectedTower = (towerId: UUID) => {
    // If the value is not a valid UUID, do nothing
    if (!isValidUUID(towerId)) return
    // Navigate to the tower page
    router.push(`/tower/${towerId}`)
  }

  const towerNames = towers.map((tower) => tower.name)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? value
            : "Select tower..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Towers..." />
          
          <CommandEmpty>
            No tower found. Perhaps you should <br />
           <Button>Create a new one.</Button>
           </CommandEmpty>
          <CommandGroup>
            <CommandItem
                key='new'
                onSelect={() => {
                  setOpen(false)
                  router.push('/tower/new')
                }}
              >
                <Button className='mx-auto items-center' > New Tower </Button>

            </CommandItem>
            {towers.map((tower) => (
              <CommandItem
                key={tower.id}
                onSelect={(currentValue) => {
                  if (currentValue === value) return
                  setValue(capitalizeFirstLetter(currentValue))
                  setOpen(false)
                  navigateToSelectedTower(tower.id)
                }}
              >
                <GiWhiteTower className="mr-2 h-4 w-4" />
                {tower.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Capitilize the first letter of every word in a string
function capitalizeFirstLetter(string: string) {
  return string
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}