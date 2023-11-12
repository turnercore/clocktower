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

const InvitedUsersList = ({
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

  //TODO add ability to remove user if isInteractable
  return (
    <div className='flex flex-row space-x-2 items-center justify-start overflow-x-auto'>
      {isInteractable
        ? profiles.map((user) => (
            <AlertDialog key={user.id}>
              <AlertDialogTrigger asChild>
                <Avatar className=' hover:cursor-pointer'>
                  <AvatarImage
                    style={{ backgroundColor: user.color || '#FFFFFF' }}
                    src={`https://robohash.org/${hash(
                      user.username || 'clocktower',
                    )}?set=set${user.avatar_set}&size=64x64`}
                  />
                  <AvatarFallback delayMs={600}>
                    {user.username?.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>Remove {user.username}?</AlertDialogHeader>
                <p>
                  Are you sure you want to remove {user.username} from this
                  tower?
                </p>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      console.log('remove user')
                    }}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))
        : profiles.map((user) => (
            <Avatar
              key={user.id}
              onClick={() => {}}
              style={{ backgroundColor: user.color || '#FFFFFF' }}
            >
              <AvatarImage
                style={{ backgroundColor: user.color || '#FFFFFF' }}
                src={`https://robohash.org/${hash(
                  user.username || 'clocktower',
                )}?set=set${user.avatar_set}&size=64x64`}
              />
              <AvatarFallback delayMs={600}>
                {user.username?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
    </div>
  )
}

export default InvitedUsersList
