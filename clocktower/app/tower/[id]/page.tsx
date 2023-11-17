import { UUIDSchema, type UUID } from '@/types/schemas'
import { Tower } from './components/Tower'
import Link from 'next/link'
import { Button } from '@/components/ui'

type pageParams = {
  id: UUID
}

type searchParams = {
  public_key?: string
}

export default async function TowerPage({
  params,
  searchParams,
}: {
  params: pageParams
  searchParams: searchParams
}) {
  const { id } = params
  const { public_key } = searchParams

  // Validate params:
  try {
    if (!id) {
      throw new Error('Missing id')
    }

    UUIDSchema.parse(id)
  } catch (error) {
    return (
      <div className='flex flex-col items-center mt-28 text-center mb-[250px]'>
        <h1 className='text-xl mb-4'>
          Can't find your tower, or the id is invalid. Go home, you're drunk.
        </h1>
        <Button variant='outline' asChild>
          <Link href='/'>Take me home.</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='mb-[250px]'>
      <Tower towerId={id} publicKey={public_key || ''} />
    </div>
  )
}
