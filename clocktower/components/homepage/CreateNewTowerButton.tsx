'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, toast } from '@/components/ui'
import insertNewTowerSA from '@/tools/actions/insertNewTowerSA'

export default function CreateNewTowerButton() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNewTower = async () => {
    if (isCreating) return

    setIsCreating(true)
    const newTowerId = crypto.randomUUID()
    const { error } = await insertNewTowerSA(newTowerId)

    if (error) {
      toast({
        title: 'Error Creating Tower',
        description: error,
        variant: 'destructive',
      })
      setIsCreating(false)
      return
    }

    router.push(`/tower/${newTowerId}`)
  }

  return (
    <Button
      variant='outline'
      type='button'
      disabled={isCreating}
      onClick={handleCreateNewTower}
    >
      {isCreating ? 'Creating tower...' : 'Or create a new tower!'}
    </Button>
  )
}
