'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, toast } from '@/components/ui'
import insertNewTowerSA from '@/tools/actions/insertNewTowerSA'
import { GoPlusCircle } from 'react-icons/go'

type CreateNewTowerButtonProps = {
  className?: string
  iconOnly?: boolean
}

export default function CreateNewTowerButton({
  className = '',
  iconOnly = false,
}: CreateNewTowerButtonProps) {
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
      size={iconOnly ? 'icon' : 'default'}
      disabled={isCreating}
      onClick={handleCreateNewTower}
      className={className}
      aria-label={iconOnly ? 'Create new tower' : undefined}
    >
      {iconOnly ? (
        <GoPlusCircle className='h-[1.2rem] w-[1.2rem]' />
      ) : isCreating ? (
        'Creating tower...'
      ) : (
        'Or create a new tower!'
      )}
    </Button>
  )
}
