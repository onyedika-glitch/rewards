import React from 'react'
import { sampleHubData } from '../../data/rewardsData'
import CardsGrid from './CardsGrid'
import EarnMoreCard from './EarnMoreCard'
import ReferralSection from './ReferralSection'
import './RewardsHub.css'

const RewardsHub: React.FC = () => {
  const data = sampleHubData

  return (
    <div className="rewards-hub">
      <div className="hub-header">
        <div className="hub-title">
          <h1>Rewards Hub</h1>
          <p className="sub">Earn points, unlock rewards, and celebrate your progress!</p>
        </div>
        <div className="hub-tabs">
          <div className="tabs">
            <button className={`tab ${window.location.hash !== '#redeem' ? 'active' : ''}`} onClick={() => (window.location.hash = '#rewards')}>Earn Points</button>
            <button className={`tab ${window.location.hash === '#redeem' ? 'active' : ''}`} onClick={() => (window.location.hash = '#redeem')}>Redeem Rewards</button>
          </div>
        </div>
      </div>

      <div className="your-journey">
        <h2>Your Rewards Journey</h2>
        <CardsGrid data={data} />
      </div>

      <div className="earn-more">
        <h3>Earn More Points</h3>
        <div className="earn-list">
          {data.earnMore.map((e) => (
            <EarnMoreCard key={e.id} item={e} />
          ))}
        </div>
      </div>

      {/* Refer & Earn (now a flow block) */}
      <div className="refer-flow">
        <ReferralSection />
      </div>
    </div>
  )
}

export default RewardsHub
