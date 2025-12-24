import React from 'react'
import type { Reward } from '../types'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

interface RewardListProps {
  rewards: Reward[]
  userCoins: number
  onRedeem: (newCoins: number) => void
}

const RewardList: React.FC<RewardListProps> = ({ rewards, userCoins, onRedeem }) => {
  const { user } = useAuth()

  const handleRedeem = async (reward: Reward) => {
    if (!user) return
    if (userCoins < reward.cost) {
      alert('Not enough coins')
      return
    }
    try {
      // Insert redemption
      const { error: redemptionError } = await supabase
        .from('redemptions')
        .insert({ user_id: user.id, reward_id: reward.id })
      if (redemptionError) throw redemptionError
      // Update user coins
      const newCoins = userCoins - reward.cost
      onRedeem(newCoins)
      alert('Reward redeemed!')
    } catch (err) {
      console.error('Failed to redeem', err)
      alert('Failed to redeem')
    }
  }

  return (
    <div className="reward-list">
      {rewards.map(reward => (
        <div key={reward.id} className="reward-item">
          <h3>{reward.name}</h3>
          <p>{reward.description}</p>
          <p>Cost: {reward.cost} coins</p>
          <button onClick={() => handleRedeem(reward)} disabled={userCoins < reward.cost}>
            Redeem
          </button>
        </div>
      ))}
    </div>
  )
}

export default RewardList