'use client'
import { UUID } from '@/types'
import { useState } from 'react'

const Home: React.FC = () => {
  const [towerId, setTowerId] = useState<UUID>(crypto.randomUUID() as UUID)
  
  const rowData = {}
  return (
    <div className="flex flex-col">
      <h1> Welcome to Clocktower </h1>
    </div>
  )
}

export default Home
