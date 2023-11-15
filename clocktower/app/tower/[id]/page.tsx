import { type UUID } from '@/types/schemas'
import { Tower } from './components/Tower'

type ExpectedParams = {
  id: UUID
}

export default async function TowerPage({
  params,
}: {
  params: ExpectedParams
}) {
  // 1. Validate the incoming params
  const { id } = params
  if (!id) {
    return <p>Invalid tower ID.</p>
  }

  // Fetch

  return (
    <div className='mb-[250px]'>
      <Tower towerId={id} />
    </div>
  )
}
