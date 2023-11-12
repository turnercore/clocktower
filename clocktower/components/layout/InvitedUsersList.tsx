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
} from '@/components/ui'
import hash from '@/tools/hash'
import { ProfileRow, UUID } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const InvitedUsersList = async ({
  isInteractable = false,
}: {
  isInteractable: boolean
}) => {
  // Grab invited users from towerId
  const supabase = createClientComponentClient<Database>()
  const params = useParams()
  const path = usePathname()
  const towerId: UUID = params.id as UUID
  const [users, setUsers] = useState<UUID[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])

  useEffect(() => {
    const getInvitedUsers = async () => {
      const { data, error } = await supabase
        .from('towers')
        .select('users')
        .eq('id', towerId)
        .single()

      if (error || !data.users) {
        console.error(error)
        return <></>
      }

      const userIds = data.users
      setUsers(userIds)
      // Now for each userId go to profiles and fetch the profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (userError || !userData) {
        console.error(userError)
        return <></>
      }

      const users = userData
      setProfiles(users)
    }

    getInvitedUsers()
  }, [towerId])

  //TODO add ability to remove user if isInteractable
  return (
    <>
      {isInteractable &&
        profiles.map((user) => (
          <AlertDialog>
            <AlertDialogTrigger>
              <Avatar key={user.id} onClick={() => {}}>
                <AvatarImage
                  src={`https://robohash.org/${hash(
                    user.username || 'clocktower',
                  )}?size=64x64&set=set${user.avatar_set || '1'}}`}
                />
                <AvatarFallback>
                  {user.username?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogFooter>
                <AlertDialogAction>Y</AlertDialogAction>
                <AlertDialogCancel>N</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      {!isInteractable &&
        profiles.map((user) => (
          <Avatar key={user.id} onClick={() => {}}>
            <AvatarImage
              src={`https://robohash.org/${hash(
                user.username || 'clocktower',
              )}?size=64x64&set=set${user.avatar_set || '1'}}`}
            />
            <AvatarFallback>
              {user.username?.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
    </>
  )
}

export default InvitedUsersList
