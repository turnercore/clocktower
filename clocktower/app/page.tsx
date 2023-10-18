'use client'
import {Clock, ClockProps} from '@/components/clocks/Clock'
import {Tower} from '@/components/clocks/Tower'

const Home: React.FC = () => {
  const rowData = {}
  return (
    <div className="flex flex-col">
      <Tower towerId='new tower'/>
    </div>
  )
}

export default Home
