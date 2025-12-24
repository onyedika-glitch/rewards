import React from 'react'
import PointsCard from './PointsCard'
import StreakCard from './StreakCard'
import OfferCard from './OfferCard'
import InteractiveCard from './InteractiveCard'
import type { HubData } from '../../data/rewardsData'
import { useAuth } from '../../AuthContext'
import { useUserCoins } from '../../hooks/useRewards'

const CardsGrid: React.FC<{ data: HubData }> = ({ data }) => {
  const { user } = useAuth()
  const { coins, updateCoins } = useUserCoins(user?.id || '')

  const computedBalance = {
    points: typeof coins === 'number' ? coins : (data.balance?.points ?? 0),
    goal: data.balance.goal,
    note: data.balance.note,
  }

  return (
    <div className="cards-grid">
      <InteractiveCard className="left-col">
        <PointsCard balance={computedBalance} />
      </InteractiveCard>

      <InteractiveCard className="mid-col">
        <StreakCard streak={data.streak} userId={user?.id} coins={coins} updateCoins={user ? updateCoins : undefined} />
      </InteractiveCard>

      <InteractiveCard className="right-col">
        <OfferCard offer={data.featuredOffer} coins={coins} updateCoins={user ? updateCoins : undefined} />
      </InteractiveCard>
    </div>
  )
}

export default CardsGrid
