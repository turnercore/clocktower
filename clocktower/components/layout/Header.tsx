import UserAvatar from "../user/UserAvatar"
import { ModeToggle } from "@/components/ui"

export default function Header() {
  return (
    <header className="bg-gray-500 bg-opacity-10 top-0 w-full h-[62px] flex justify-between items-center p-4">
      <ModeToggle className='hover:scale-105 hover:shadow active:scale-100 active:shadow-inner'/>
      <div className='flex mt-1 mb-1'>
          <UserAvatar />
      </div>  
    </header>
  )
}
