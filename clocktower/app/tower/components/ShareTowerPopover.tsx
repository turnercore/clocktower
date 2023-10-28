'use client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, usePathname } from 'next/navigation'
import { TbUserShare } from 'react-icons/tb'
import { toast } from '../../../components/ui'
import { UUID } from '@/types'

export default function ShareTowerPopover() {
  const path = usePathname()
  const params = useParams<{ id: string }>()
  const towerId: UUID = params.id as UUID
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOnTowerPage, setIsOnTowerPage] = useState(false)
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
    }
    fetchUserId()
  }, [towerId, path])

  const handleInvite = async () => {
    if (!username || !towerId) return;
    setIsLoading(true);
  
    try {
      // Check if the user with the entered username exists
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .single();
      
      // Error handling
      if (profilesError || !profilesData) throw profilesError || new Error("User not found.");
  
      const invitedUserId = profilesData.id;
      
      // Call the add_user_to_tower function to handle the rest
      const { error: addError } = await supabase
        .rpc('add_user_to_tower', { tower: towerId, new_user_id: invitedUserId });
      
      if (addError) throw addError;
      
      // Add entry in the friends table
      const { error: friendsInsertError } = await supabase
        .from('friends')
        .upsert([{ user_id: userId, friend_id: invitedUserId }]);
      
      if (friendsInsertError) throw friendsInsertError;
      
      toast({
        title: "User invited",
        description: `User ${username} has been invited to the tower.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: `Unable to invite user "${username}"`,
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
    setUsername('');
  }
  
  
  return (
    ( isOnTowerPage && userId ) && (
    <Popover>
      <PopoverTrigger asChild>
        <Button title="Invite Users" variant={'ghost'} className="ml-2">
          <TbUserShare className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Invite User</h4>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-2 h-8"
              />
            </div>
            <Button onClick={handleInvite}>Invite</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ) )
}
