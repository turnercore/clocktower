import { UUIDSchema, type UUID } from '@/types/schemas'
import { Tower } from './components/Tower'
import Link from 'next/link'
import { Button } from '@/components/ui'

type PageParams = Promise<{
  id: string
}>

type PageSearchParams = Promise<{
  public_key?: string
}>

type TowerPageProps = {
  params: PageParams
  searchParams: PageSearchParams
}

export default async function TowerPage(props: TowerPageProps) {
  const { id } = await props.params
  const { public_key } = await props.searchParams
  let towerId: UUID

  // Validate params:
  try {
    if (!id) {
      throw new Error('Missing id')
    }

    towerId = UUIDSchema.parse(id)
  } catch (error) {
    return (
      <div className='flex flex-col items-center mt-28 text-center mb-[250px]'>
        <h1 className='text-xl mb-4'>
          Can&apos;t find your tower, or the id is invalid. Go home, you&apos;re drunk.
        </h1>
        <Button variant='outline' asChild>
          <Link href='/'>Take me home.</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='mb-[250px]'>
      <Tower towerId={towerId} publicKey={public_key || ''} />
    </div>
  )
}
