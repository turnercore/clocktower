'use client'
import { useEffect, useState } from 'react'
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
import inviteUserToTowerSA from './actions/inviteUserToTowerSA'
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
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const [isTowerOwner, setIsTowerOwner] = useState(false)
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
          return
        }

        const currentUserId = sessionData.session.user.id
        setUserId(currentUserId)

        const { data: towerData, error: towerError } = await supabase
          .from('towers')
          .select('owner, users, public_key')
          .eq('id', towerId)
          .single()

        if (towerError) {
          console.error(towerError)
          return
        }

        setIsTowerOwner(towerData.owner === currentUserId)
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

  const handleInvite = async () => {
    if (!userId) return

    const { error } = await inviteUserToTowerSA({
      inputUserId: userId,
      inputInvitedUsername: username,
      inputTowerId: towerId,
    })

    if (error) {
      toast({
        title: 'Error inviting user!',
        description: error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'User invited!',
      description: `User ${username} has been invited to the tower.`,
    })
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
    userId && (
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
          <div className='flex flex-col space-y-6'>
            <h4 className='font-medium leading-none'>
              Invite a User to this Tower
            </h4>
            <div className='flex flex-row items-center space-x-2'>
              <Label htmlFor='username'>Username</Label>
              <Input
                id='username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className='col-span-2 h-8'
              />
              <Button onClick={handleInvite}>Invite</Button>
            </div>
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
                <InvitedUsersList />
              </div>
            )
          }
        </PopoverContent>
      </Popover>
    )
  )
}
