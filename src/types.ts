interface User {
  id: string
  email: string
  coins: number
}

interface Reward {
  id: string
  name: string
  cost: number
  description: string
}

interface Redemption {
  id: string
  user_id: string
  reward_id: string
  date: string
  reward: Reward
}

interface Referral {
  link?: string
  referrals?: number
  pointsEarned?: number
  note?: string
}

export type { User, Reward, Redemption, Referral }