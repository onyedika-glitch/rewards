export type Offer = {
  id: string
  title: string
  description: string
  points: number
  ctaText: string
  image?: string
  url?: string
}

export type EarnMore = {
  id: string
  title: string
  description: string
  points: number
}

export type HubData = {
  balance: { points: number; goal: number; note?: string }
  streak: { days: number; todayClaimed: boolean; pointsPerDay: number }
  featuredOffer?: Offer
  earnMore: EarnMore[]
}

export const sampleHubData: HubData = {
  balance: { points: 0, goal: 5000, note: "Just getting started — keep earning points!" },
  streak: { days: 1, todayClaimed: false, pointsPerDay: 5 },
  featuredOffer: {
    id: 'offer-1',
    title: 'Reclaim — Automate and Optimize Your Schedule',
    description: "Reclaim.ai is an AI-powered calendar assistant that automatically schedules your tasks, meetings, and breaks to boost productivity.",
    points: 50,
    ctaText: 'Claim 50 pts',
    image: 'https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=8b6f3f9f4a2b9b26728b6d9f7e3d1e6e',
    url: 'https://reclaim.ai',
  },
  earnMore: [
    { id: 'e-1', title: 'Refer and win 10,000 points!', description: 'Invite 3 friends by Nov 20 and earn a chance to be one of 5 winners of 10,000 points. Friends must complete onboarding to qualify.', points: 10000 },
    { id: 'e-2', title: 'Share Your Stack', description: 'Share your stack to earn points.', points: 50 }
  ],
  referral: {
    link: 'https://app.flowwahub.com/signup/?ref=omogo3960',
    referrals: 0,
    pointsEarned: 0,
    note: 'Invite friends and earn 25 points when they join!'
  }
}

/* sampleRedeemRewards removed — rewards now come exclusively from the database.
   If you need seeded sample data for local development, use the migration:
   supabase/migrations/003_create_rewards_and_redemptions_and_seed.sql */

