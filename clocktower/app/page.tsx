'use client'
import Tower from '@/components/clocks/Tower'
import { UUID } from '@/types'
import { useState } from 'react'

const Home: React.FC = () => {
  const [towerId, setTowerId] = useState<UUID>(crypto.randomUUID() as UUID)
  
  const rowData = {}
  return (
    <div className="flex flex-col">
      <Tower towerId={towerId}/>
    </div>
  )
}

export default Home
