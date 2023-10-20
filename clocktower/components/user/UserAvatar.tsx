'use client'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import LoginForm from "@/components/forms/LoginForm"
import { User, createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import SignOutButton from "./SignOutButton"
import { useEffect, useState } from "react"
import type { Profile } from "@/types"
import { PersonIcon } from "@radix-ui/react-icons"

export default function UserAvatar() {
  const [isHovered, setIsHovered] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  //Get user on mount
  useEffect(() => {
    const getSupabaseUser = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data } = await supabase.auth.getSession()
        if (!data) return null
        if (!data.session) return null
        if (!data.session.user) return null
        setUser(data.session.user)
      } catch (error: any) {
        console.error(error.message)
      }
    }

    getSupabaseUser()
  }, [])

  //When user changes, get the user's profile from supabase
  useEffect(() => {
    if (!user) return
      // Fetch the user's profile
      const fetchProfile = async () => {
        try {
          if(!user) return
          const supabase = createClientComponentClient()
          const { data: fetchedProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
      
          setProfile(fetchedProfile)
        } catch(error: any) {
          console.error(error.message)
        }
      }
      fetchProfile()
  }, [user])

  // Dialog for login form
  const notLoggedInDialog = (
    <Dialog open={isDialogOpen} onOpenChange={(open) => setIsDialogOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className=" text-center">Login</DialogTitle>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )

  // Avatar for non-logged-in users
  const notLoggedInHtml = (
    <Avatar
      onClick={() => setIsDialogOpen(true)}
      className="w-10 h-10 cursor-pointer hover:shadow hover:scale-105 active:scale-100 active:shadow-inner"
    >
      <AvatarFallback> <PersonIcon className="h-5 w-5" /> </AvatarFallback>
    </Avatar>
  )

  if (!user || !profile) return (
    <>
      {notLoggedInHtml}
      {notLoggedInDialog}
    </>
  )
  
  if (!user || !profile) return (
    <>
      {notLoggedInHtml}
      {notLoggedInDialog}
    </>
  )
  else return (
      <DropdownMenu>
        <DropdownMenuTrigger>
        <Avatar
          className="w-14 h-14 cursor-pointer bg-primary transition-all duration-300 hover:shadow-lg hover">
          <AvatarImage
            className="w-full h-full object-cover object-center"
            src={profile.avatar_url}
          ></AvatarImage>
          <AvatarFallback> AI </AvatarFallback>
        </Avatar>
        
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <Link href="/tokens">
            <DropdownMenuItem>Tokens</DropdownMenuItem>
          </Link>
          <Link href="/keys">
            <DropdownMenuItem>Keys</DropdownMenuItem>
          </Link>
          <Link href="/account">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
          <DropdownMenuItem className = 'justify-center items-center'>
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
}