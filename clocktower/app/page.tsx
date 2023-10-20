'use client'
import Tower from '@/components/clocks/Tower'
import { UUID } from '@/types'
import { useState } from 'react'

const Home: React.FC = () => {
  const [towerId, setTowerId] = useState<UUID>(crypto.randomUUID() as UUID)
  
  const rowData = {}
  return (
    <div className="flex flex-col">
      <Tower towerId={'096d510f-018c-4fd2-b75f-82ec3ef4ec21'}/>
    </div>
  )
}

export default Home
