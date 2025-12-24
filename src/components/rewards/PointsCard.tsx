import React from 'react'
import type { HubData } from '../../data/rewardsData'

const PointsCard: React.FC<{ balance: HubData['balance'] }> = ({ balance }) => {
  const progress = Math.min(100, Math.round((balance.points / balance.goal) * 100))
  return (
    <div className="card points-card" tabIndex={0} aria-label="Points card">
      <div className="card-header">
        <div className="badge">🏆</div>
        <h3>Points Balance</h3>
      </div>
      <div className="card-body">
        <div className="points-number" aria-live="polite">{balance.points}</div>
        <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Points progress">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-meta">Progress to ${balance.goal} Gift Card — {balance.points}/{balance.goal}</div>
        <div className="note">{balance.note}</div>
      </div>
    </div>
  )
}

export default PointsCard
