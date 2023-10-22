'use client'
import {
  Avatar,
  AvatarImage,
  Button,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui"
import LoginForm from "@/components/forms/LoginForm"
import { User, createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import SignOutButton from "./SignOutButton"
import { useEffect, useState } from "react"
import type { Profile, UUID } from "@/types"
import { generateUsername } from '@/tools/generateUsername'
import { UserIcon } from '@/components/user/UserIcon'
import { GiMeeple } from "react-icons/gi"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings } from "lucide-react"

export default function UserAvatar() {
  // ... existing state and useEffect hooks
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

  // When user changes, get the user's profile from Supabase
  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      try {
        const supabase = createClientComponentClient()
        const { data: fetchedProfile, error } = await supabase
          .from("profiles")
          .select("id, icon, color, icon_color, username")
          .eq("id", user.id)
          .single()

        if (!fetchedProfile) {
          //If no user profile is found we'll create our own
          const newProfile: Profile = {
            id: user.id as UUID,
            icon: 'default',
            color: '#FFFFFF',
            icon_color: '#000000',
            username: generateUsername(),
          }
          //then we insert it into the database
          const { error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile)
          
          if (insertError) throw insertError

          setProfile(newProfile)
        } else {
          let updatedProfile: Profile = { ...fetchedProfile }
          let needsUpdate = false
  
          if (fetchedProfile.icon === null) {
            updatedProfile.icon = 'default'
            needsUpdate = true
          }
          if (fetchedProfile.color === null) {
            updatedProfile.color = '#FFFFFF' // Hex for white
            needsUpdate = true
          }
          if (fetchedProfile.icon_color === null) {
            updatedProfile.icon_color = '#000000' // Hex for black
            needsUpdate = true
          }
          if (fetchedProfile.username === null) {
            updatedProfile.username = generateUsername()
            needsUpdate = true
          }
          
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update(updatedProfile)
              .eq("id", user.id)
  
            if (updateError) throw updateError
          }
          setProfile(updatedProfile)
        }
      } catch (error: any) {
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
          <DialogTitle className="text-center">Login</DialogTitle>
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
      <AvatarFallback> <GiMeeple className="h-5 w-5" /> </AvatarFallback>
    </Avatar>
  )




  if (!user || !profile) return (
    <>
      {notLoggedInHtml}
      {notLoggedInDialog}
    </>
  )

  const loggedInHtml = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className={`rounded-full`} style={{ backgroundColor: profile.color }}>
          <UserIcon name={profile.icon} color={profile.color} color_icon={profile.icon_color} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="text-center">{profile.username}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <Link href="/account">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return loggedInHtml
}