import React from 'react'
import { useAuth } from '../AuthContext'
import RewardsHub from './rewards/RewardsHub' 

const RewardsPage: React.FC = () => {
  const { user } = useAuth()

  if (!user) return <div>Please log in</div>

  return (
    <div className="rewards-page">
      <RewardsHub />
    </div>
  )
}

export default RewardsPage