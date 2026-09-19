'use client'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { useParams, usePathname } from 'next/navigation'
import { TbUserShare } from 'react-icons/tb'
import { Switch, toast } from '../ui'
import { UUID } from '@/types/schemas'
import { inviteUserToTower } from '@/lib/towers/invite-user-request'
import InvitedUsersList from './InvitedUsersList'
import shareTowerPubliclySA from './actions/shareTowerPubliclySA'
import { GoCopy } from 'react-icons/go'

const domain = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'

export default function ShareTowerPopover() {
  const path = usePathname()
  const params = useParams<{ id: string }>()
  const towerId: UUID = params.id as UUID
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const inviteInFlight = useRef(false)
  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const [isTowerOwner, setIsTowerOwner] = useState(false)
  const [canShareTower, setCanShareTower] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<UUID[]>([])
  const [isTowerPublic, setIsTowerPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [publicUrl, setPublicUrl] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchUserIdAndDetermineOwner = async () => {
      setIsLoading(true)
      try {
        if (path.includes('tower') && towerId) {
          setIsOnTowerPage(true)
        } else {
          setIsOnTowerPage(false)
          setCanShareTower(false)
          return
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession()
        if (sessionError) {
          console.error(sessionError)
          return
        }

        if (!sessionData.session?.user) {
          console.error('No user found in session data')
          setUserId(null)
          setCanShareTower(false)
          return
        }

        const currentUserId = sessionData.session.user.id
        setUserId(currentUserId)

        const { data: towerData, error: towerError } = await supabase
          .from('towers')
          .select('owner, users, admin_users, is_locked, public_key')
          .eq('id', towerId)
          .single()

        if (towerError) {
          console.error(towerError)
          setCanShareTower(false)
          return
        }

        const currentUserIsOwner = towerData.owner === currentUserId
        const currentUserIsAdmin = Boolean(
          towerData.admin_users?.includes(currentUserId),
        )
        setIsTowerOwner(currentUserIsOwner)
        setCanShareTower(
          currentUserIsOwner || (currentUserIsAdmin && !towerData.is_locked),
        )
        // filter out current user
        const currentInvitedUsers = (towerData.users ?? []).filter(
          (user: UUID) => user !== currentUserId,
        )
        setInvitedUsers(currentInvitedUsers || [])
        // See if tower is public
        if (towerData.public_key) {
          setIsTowerPublic(true)
          const url = domain + path + `?public_key=${towerData.public_key}`
          setPublicUrl(url)
        } else {
          setIsTowerPublic(false)
          setPublicUrl('')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserIdAndDetermineOwner()
  }, [towerId, path, supabase])

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const invitedUsername = username.trim()
    if (!userId || !invitedUsername || inviteInFlight.current) return

    inviteInFlight.current = true
    setIsInviting(true)
    try {
      const { userId: invitedUserId } = await inviteUserToTower(towerId, invitedUsername)
      setUsername('')
      setInvitedUsers((users) =>
        invitedUserId === userId || users.includes(invitedUserId)
          ? users
          : [...users, invitedUserId],
      )
      setMembersRefreshKey((key) => key + 1)
      toast({
        title: 'User invited!',
        description: `User ${invitedUsername} has been invited to the tower.`,
      })
    } catch (error) {
      toast({
        title: 'Error inviting user!',
        description: error instanceof Error ? error.message : 'Could not invite this user. Please try again.',
        variant: 'destructive',
      })
    } finally {
      inviteInFlight.current = false
      setIsInviting(false)
    }
  }

  const handleTowerPublicSwitch = async (checked: boolean) => {
    // Set local state
    const oldTowerPublicState = isTowerPublic
    const oldPublicUrl = publicUrl
    setIsTowerPublic(checked)

    // Update database
    const { data, error } = await shareTowerPubliclySA({
      towerId,
      setPublic: checked,
    })
    if (error) {
      // Switch back local state if error
      setIsTowerPublic(oldTowerPublicState)
      setPublicUrl(oldPublicUrl)
      toast({
        title: 'Error changing tower public status.',
        description: error,
        variant: 'destructive',
      })
      console.error(error)
      return
    }

    const publicKey = data?.publicKey
    if (publicKey) {
      const url = domain + path + `?public_key=${publicKey}`
      setPublicUrl(url)
    } else {
      setPublicUrl('')
    }
  }

  if (isLoading) return <></>

  return (
    isOnTowerPage &&
    userId &&
    canShareTower && (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            title='Share Tower'
            aria-label='Share Tower'
            variant='outline'
            size='icon'
          >
            <TbUserShare className='h-5 w-5' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80'>
          <div className='flex flex-col gap-6'>
            <h4 className='font-medium leading-none'>
              Invite a User to this Tower
            </h4>
            <form onSubmit={handleInvite} className='flex flex-col gap-2' aria-busy={isInviting}>
              <Label htmlFor='invite-username'>Username</Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='invite-username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize='none'
                  autoCorrect='off'
                  maxLength={30}
                  required
                  disabled={isInviting}
                  className='min-w-0'
                />
                <Button type='submit' disabled={isInviting || !username.trim()}>
                  {isInviting ? 'Inviting…' : 'Invite'}
                </Button>
              </div>
            </form>
            <div className='flex flex-row items-center space-x-2'>
              <Switch
                checked={isTowerPublic}
                id='isTowerPublic'
                onCheckedChange={handleTowerPublicSwitch}
              />
              <Label htmlFor='isTowerPublic'>Share Tower Publicly</Label>
            </div>
            {isTowerPublic && (
              <div className='flex flex-row items-center space-x-2'>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(publicUrl)
                    toast({
                      title: 'Copied to clipboard!',
                      description:
                        'The public URL has been copied to your clipboard.',
                    })
                  }}
                >
                  <GoCopy />
                </Button>
                <p className='font-medium leading-none p-2'>
                  Copy Tower&apos;s Public URL
                </p>
              </div>
            )}
          </div>
          {
            // If users are invited, show them
            invitedUsers.length > 0 && (
              <div className='mt-8'>
                <h1 className='mb-2'>
                  Invited Users{isTowerOwner ? ', Click to Remove' : ''}
                </h1>
                <InvitedUsersList refreshKey={membersRefreshKey} />
              </div>
            )
          }
        </PopoverContent>
      </Popover>
    )
  )
}
