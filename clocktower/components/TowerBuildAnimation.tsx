import React from 'react'
import '../styles/towerBuildAnimation.css'
import LoadingSpinner from '@/components/loading/LoadingSpinner'

const TowerBuildingAnimation = () => {
  return (
    <div className='relative'>
      <div className='tower-container'>
        {/* Repeating rows for the tower structure */}
        {Array(13).fill(
          <div className='row'>
            <div className='brick' />
            <div className='brick' />
            <div className='brick' />
            <div className='brick' />
          </div>,
        )}
        {/* Placeholder for the clock face */}
        <LoadingSpinner className='absolute top-[20px] right-[35px] clock-tower-face' />
      </div>
    </div>
  )
}

export default TowerBuildingAnimation
