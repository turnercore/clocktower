// AvatarWithPresence.tsx
'use client'
import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  toast,
} from '@/components/ui'
import hash from '@/tools/hash'
import { ProfileRow } from '@/types/schemas'
import { AlertDialog, AlertDialogCancel } from '@radix-ui/react-alert-dialog'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import { useState } from 'react'

interface AvatarWithPresenceProps {
  user: ProfileRow
  isInteractable: boolean
  isOnline: boolean // This prop will be used to show presence
}

const AvatarWithPresence = ({
  user,
  isInteractable,
  isOnline,
}: AvatarWithPresenceProps) => {
  const supabase = createClientComponentClient()
  const params = useParams()
  const [isDeleted, setIsDeleted] = useState(false)

  const handleDefenestration = async () => {
    if (!isInteractable) return
    if (!params.id) return
    setIsDeleted(true)
    // Call supabase to remove user from tower.
    const { error } = await supabase.rpc('remove_user_from_tower', {
      userid: user.id,
      tower: params.id,
    })

    if (error) {
      console.error(error)
      toast({
        title: 'Error defenestrating user',
        description: error.message,
        variant: 'destructive',
      })
      setIsDeleted(false)
    }
  }

  if (isDeleted) {
    return null
  }

  const avatar = (
    <div className='relative inline-block'>
      <Avatar
        onClick={() => {}}
        style={{ backgroundColor: user.color || '#FFFFFF' }}
      >
        <AvatarImage
          src={`https://robohash.org/${hash(
            user.username || 'clocktower',
          )}?set=set${user.avatar_set}&size=64x64`}
          alt={user.username || 'Avatar'}
        />
        <AvatarFallback delayMs={600}>
          {user.username?.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {/* Presence Indicator */}
      {isOnline && (
        <span className='w-3 h-3 bg-green-500 absolute bottom-0 right-0 rounded-full border-2 border-white'></span>
      )}
    </div>
  )

  return isInteractable ? (
    <AlertDialog>
      <AlertDialogTrigger>{avatar}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>Are you sure?</AlertDialogHeader>
        <p>Are you sure you want to defenestrate {user.username}?</p>
        <AlertDialogFooter>
          <AlertDialogCancel>🙅‍♀️ Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='vibrating-element bg-red-500'
            onClick={handleDefenestration}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    avatar
  )
}

export default AvatarWithPresence
