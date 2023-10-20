import Tower from '@/components/clocks/Tower'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { UUID } from '@/types'

export default async function PostsCategory({ params }: { params: { id: UUID } }) {
  const id = params.id
  const supabase = createServerComponentClient({ cookies })
  // Check if the id is valid
  const { data, error } = await supabase.from('towers').select('id').eq('id', id).single()
  if(error || !data) {
    console.error(error)
    return (
      <div className="flex flex-col">
        <p>That tower does not exist. Did you mean to create a new one?</p>
      </div>
    )
  } else {
    return (
      <div className="flex flex-col">
        <Tower towerId={id as UUID}/>
      </div>
    )
  }
}