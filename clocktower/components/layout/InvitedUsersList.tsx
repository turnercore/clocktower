'use client'
import {
  Avatar,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
  AvatarFallback,
  AvatarImage,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui'
import hash from '@/tools/hash'
import { ProfileRow, UUID } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import AvatarWithPresence from '@/components/user/AvatarWithPresence'
import useWindowSize from '@/hooks/useWindowSize'
import useRealtimePresence from '@/hooks/useRealtimePresence'

interface InvitedUsersListProps {
  isInteractable: boolean
}

const InvitedUsersList = ({
  isInteractable = false,
}: InvitedUsersListProps) => {
  // Grab invited users from towerId
  const supabase = createClientComponentClient<Database>()
  const params = useParams()
  const path = usePathname()
  const windowSize = useWindowSize()
  const towerId: UUID = params.id as UUID
  const presences = useRealtimePresence(towerId)
  const [users, setUsers] = useState<UUID[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  // State to track expanded state of avatar list
  const [isExpanded, setIsExpanded] = useState(false)
  const [maxAvatars, setMaxAvatars] = useState(3)

  // Function to toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Get invited users from tower
  useEffect(() => {
    const getInvitedUsers = async () => {
      const { data, error } = await supabase
        .from('towers')
        .select('users')
        .eq('id', towerId)
        .single()

      if (error || !data.users) {
        console.error(error)
        return
      }
      // Get current user's id
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.user?.id) {
        console.error(sessionError)
        return
      }

      const currentUserId = sessionData.session.user.id

      // Filter out current user
      const userIds = data.users.filter((user) => user !== currentUserId)
      setUsers(userIds)
      // Now for each userId go to profiles and fetch the profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (userError || !userData) {
        console.error(userError)
        return
      }

      //Make sure the current user is not in the list
      const users = userData.filter((user) => user.id !== currentUserId)
      setProfiles(users)
    }

    getInvitedUsers()
  }, [towerId])

  // Determine max number of avatars to show
  useEffect(() => {
    setMaxAvatars(maxAvatarsToShow(windowSize))
    if (profiles.length > maxAvatars) {
      setIsExpanded(false)
    }
  }, [windowSize, profiles.length])

  return (
    <div className='relative'>
      <div className='flex flex-row space-x-2 items-center justify-start overflow-x-auto'>
        {(isExpanded ? profiles : profiles.slice(0, maxAvatars)).map((user) => (
          <AvatarWithPresence
            key={user.id}
            user={user}
            isInteractable={isInteractable}
            isOnline={
              presences.find((presence) => presence.user_id === user.id)
                ? true
                : false
            }
          />
        ))}
        {profiles.length > maxAvatars && (
          <Avatar onClick={toggleExpanded}>
            <AvatarFallback
              delayMs={600}
              className='justify-center align-center text-center hover:cursor-pointer'
            >
              {isExpanded
                ? '<'
                : '+' + (profiles.length - Math.floor(maxAvatars))}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

const maxAvatarsToShow = ({
  height,
  width,
}: {
  height: number
  width: number
}) => {
  if (width <= 450) return 0
  return (width - 450) / 50
}

export default InvitedUsersList
