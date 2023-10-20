import UserAvatar from "../user/UserAvatar"
import { Button, ModeToggle } from "@/components/ui"
import {TowersDropdown} from "./TowersDropdown"
import { GearIcon, Share1Icon } from "@radix-ui/react-icons"

export default function Header() {
  return (
    <header className="bg-gray-500 bg-opacity-10 top-0 w-full h-[62px] flex justify-between items-center p-4">
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner'/>
      <div className="flex flex-row items-center">
        <div className="flex items-center mx-auto ml-5">
          <TowersDropdown />
        </div>
        <Button title="Tower Settings" variant={'ghost'} className="ml-2">
          <GearIcon className="h-5 w-5" />
        </Button>
        <Button title="Invite Users" variant={'ghost'} className="ml-2">
          <Share1Icon className="h-5 w-5" />
        </Button>
      </div>
      <div className='flex mt-1 mb-1'>
          <UserAvatar />
      </div>  
    </header>
  )
}
