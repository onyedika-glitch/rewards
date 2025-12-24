import React from 'react'
import type { Redemption } from '../types'

interface RedemptionHistoryProps {
  redemptions: Redemption[]
}

const RedemptionHistory: React.FC<RedemptionHistoryProps> = ({ redemptions }) => {
  return (
    <div className="redemption-history">
      {redemptions.length === 0 ? <p>No redemptions yet</p> : (
        <ul>
          {redemptions.map(redemption => (
            <li key={redemption.id}>
              {redemption.reward.name} - {new Date(redemption.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RedemptionHistory