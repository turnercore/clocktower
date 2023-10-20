import Tower from '@/components/clocks/Tower'
import { UUID } from '@/types'
import { isValidUUID } from '@/tools/isValidUUID'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'


export default async function PostsCategory({ params }: { params: { id: UUID | string } }) {
  const id = params.id
  const tower = (
    <div className="flex flex-col">
      <Tower towerId={id as UUID}/>
    </div>
  )
  // See if it's a new tower
  if (id === 'new') {
    //rewrite the url to the new tower's id
    const headersList = headers();
    const domain = headersList.get('host') || "";
    const protocol = headersList.get('protocol') || "http://";
    const newId = crypto.randomUUID()
    redirect(protocol + domain + `/tower/${newId}`)
    return (<></>)
  }
  // Check if the id is a valid UUID
  if(!id || !isValidUUID(id)) {
    return (
      <div className="flex flex-col">
        <p>That tower does not exist. Did you mean to create a new one?</p>
      </div>
    )
  } else {
    return tower
  }
}