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
} from '@/components/ui'
import hash from '@/tools/hash'
import { UUID } from '@/types/schemas'
import { Database } from '@/types/supabase'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface InvitedUsersListProps {
  towerId: UUID
}
const InvitedUsersList: React.FC<InvitedUsersListProps> = async ({
  towerId,
}) => {
  // Grab invited users from towerId
  const supabase = createServerComponentClient<Database>({ cookies })
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

  //TODO add ability to remove user
  return (
    <>
      {users.map((user) => (
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
            <AlertDialogAction>Y</AlertDialogAction>
            <AlertDialogCancel>N</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </>
  )
}

export default InvitedUsersList
