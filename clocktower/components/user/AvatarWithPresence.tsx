// AvatarWithPresence.tsx
'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import hash from '@/tools/hash'
import { ProfileRow } from '@/types/schemas'

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
  return (
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
}

export default AvatarWithPresence
