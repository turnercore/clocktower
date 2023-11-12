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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, usePathname } from 'next/navigation'
import { TbUserShare } from 'react-icons/tb'
import { toast } from '../ui'
import { UUID } from '@/types/schemas'
import inviteUserToTowerSA from './actions/inviteUserToTowerSA'
import InvitedUsersList from './InvitedUsersList'

export default function ShareTowerPopover() {
  const path = usePathname()
  const params = useParams<{ id: string }>()
  const towerId: UUID = params.id as UUID
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
  const [isTowerOwner, setIsTowerOwner] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (path.includes('tower') && towerId) {
      setIsOnTowerPage(true)
    } else return

    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session?.user.id) {
        setUserId(data.session.user.id)
      }
      determineIfUserIsTowerOwner()
    }

    const determineIfUserIsTowerOwner = async () => {
      const { data, error } = await supabase
        .from('towers')
        .select('owner')
        .eq('id', towerId)
        .single()

      if (error || !data.owner) {
        console.error(error)
        return
      }

      if (data.owner === userId) {
        setIsTowerOwner(true)
      }
    }

    fetchUserId()
  }, [towerId, path])

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

  return (
    isOnTowerPage &&
    userId && (
      <Popover>
        <PopoverTrigger asChild>
          <Button title='Invite Users' variant={'ghost'} className='ml-2'>
            <TbUserShare className='h-5 w-5' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-80'>
          <div className='grid gap-4'>
            <div className='space-y-2'>
              <h4 className='font-medium leading-none'>Invite User</h4>
              <div className='grid grid-cols-3 items-center gap-4'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='col-span-2 h-8'
                />
              </div>
              <Button onClick={handleInvite}>Invite</Button>
            </div>
            <InvitedUsersList isInteractable={isTowerOwner} />
          </div>
        </PopoverContent>
      </Popover>
    )
  )
}
