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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@/components/ui'
import hash from '@/tools/hash'
import type { ProfileRow } from '@/types/schemas'
import { AlertDialog, AlertDialogCancel } from '@radix-ui/react-alert-dialog'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import type { ReactNode } from 'react'
import kickUserFromTowerSA from '@/components/layout/actions/kickUserFromTowerSA'

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
  const params = useParams()
  const [isDeleted, setIsDeleted] = useState(false)

  const handleDefenestration = async () => {
    if (!isInteractable) return
    if (!params.id) return
    setIsDeleted(true)
    // Call supabase to remove user from tower.
    const towerId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!towerId) return
    const { error } = await kickUserFromTowerSA({ towerId, userId: user.id })

    if (error) {
      console.error(error)
      toast({
        title: 'Error removing user',
        description: error,
        variant: 'destructive',
      })
      setIsDeleted(false)
    }
  }

  if (isDeleted) {
    return null
  }

  const username = user.username || 'Clocktower user'
  const avatarSeed = user.username || 'clocktower'

  const avatar = (
    <div
      className='relative inline-flex h-11 w-11 items-center justify-center overflow-visible rounded-full'
      aria-label={`${username}${isOnline ? ' is online' : ''}`}
    >
      <div className='rounded-full transition-transform duration-150 hover:scale-110 hover:drop-shadow-xl focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'>
        <Avatar
          onClick={() => {}}
          style={{ backgroundColor: user.color || '#FFFFFF' }}
        >
          <AvatarImage
            src={`https://robohash.org/${hash(
              avatarSeed,
            )}?set=set${user.avatar_set}&size=64x64`}
            alt={username}
          />
          <AvatarFallback delayMs={600}>
            {username.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      {/* Presence Indicator */}
      {isOnline && (
        <span
          className='absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-950'
          aria-hidden='true'
        ></span>
      )}
    </div>
  )

  const tooltip = (trigger: ReactNode) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>
          <p>{username}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return isInteractable ? (
    <AlertDialog>
      {tooltip(
        <AlertDialogTrigger aria-label={`Manage ${username}`}>
          {avatar}
        </AlertDialogTrigger>,
      )}
      <AlertDialogContent>
        <AlertDialogHeader>Are you sure?</AlertDialogHeader>
        <p>Are you sure you want to remove {username} from this tower?</p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='vibrating-element bg-red-500'
            onClick={handleDefenestration}
          >
            Defenestrate (Kick User)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    tooltip(avatar)
  )
}

export default AvatarWithPresence
