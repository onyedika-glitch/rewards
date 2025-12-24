import React from 'react'
import { useAuth } from '../AuthContext'
import { useRewards } from '../hooks/useRewards'
import { useUserCoins } from '../hooks/useRewards'
import RewardCard from './rewards/RewardCard'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../supabaseClient'

const tabs = ['all', 'unlocked', 'locked', 'coming'] as const

const RedeemPage: React.FC = () => {
  const { user } = useAuth()
  const { rewards } = useRewards()
  const { coins, updateCoins } = useUserCoins(user?.id || '')
  const { addToast } = useToast()

  const [active, setActive] = React.useState<typeof tabs[number]>('all')
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  if (!user) return <div>Please sign in to redeem rewards</div>

  // Filter: only include DB rows with UUID ids, non-empty title, and either points or coming_soon
  const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  const filteredAll = rewards.filter((r: any) => {
    if (!r || typeof r !== 'object') return false
    if (typeof r.id !== 'string' || !uuidRe.test(r.id)) return false
    if (!r.title || typeof r.title !== 'string' || r.title.trim() === '') return false
    if (!(typeof r.points === 'number') && !r.coming_soon) return false
    return true
  })

  // Deduplicate by normalized title (keep first) across the full set
  const seenAll = new Set<string>()
  const dedupedAll = filteredAll.filter((r: any) => {
    const key = (r.title || '').trim().toLowerCase()
    if (seenAll.has(key)) return false
    seenAll.add(key)
    return true
  })

  // compute counts from DB-only deduped set
  const counts = {
    all: dedupedAll.length,
    unlocked: dedupedAll.filter((r: any) => !r.coming_soon && typeof r.points === 'number' && (coins || 0) >= r.points).length,
    locked: dedupedAll.filter((r: any) => !r.coming_soon && (typeof r.points !== 'number' || (coins || 0) < r.points)).length,
    coming: dedupedAll.filter((r: any) => !!r.coming_soon).length,
  }

  // Now choose the shown set for the active tab from the dedupedAll list
  const shownRaw = active === 'all' ? dedupedAll : active === 'coming' ? dedupedAll.filter((r:any)=>!!r.coming_soon) : active === 'unlocked' ? dedupedAll.filter((r:any)=>!r.coming_soon && typeof r.points === 'number' && (coins || 0) >= r.points) : dedupedAll.filter((r:any)=>!r.coming_soon && (typeof r.points !== 'number' || (coins || 0) < r.points))

  // shownRaw is already DB-only & deduped; assign to shown
  const shown = shownRaw

  const handleRedeem = async (r: any) => {
    if (!user || !updateCoins) {
      addToast({ message: 'Sign in to redeem rewards', type: 'info' })
      return
    }
    setLoadingId(r.id)
    try {
      const rpc = await supabase.rpc('redeem_reward', { p_reward_id: r.id })
      if (rpc.error) throw rpc.error
      let res = rpc.data
      if (Array.isArray(res) && res.length > 0) res = res[0]
      if (res && res.redeemed) {
        if (typeof res.new_coins === 'number') await updateCoins(res.new_coins)
        addToast({ message: `Redeemed ${r.title}!`, type: 'success' })
      } else {
        addToast({ message: `Unable to redeem: insufficient points or not available.`, type: 'info' })
      }
    } catch (err: any) {
      console.error('Redeem failed', err)
      addToast({ message: 'Redeem failed. Try again later.', type: 'error' })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="redeem-page">
      <div className="redeem-header">
        <div className="redeem-top-row">
          <button className="back-link" onClick={() => (window.location.hash = '#rewards')}>← Back</button>
          <div className="redeem-title">
            <h1>Redeem Your Points</h1>
            <p className="sub">Spend your points on available rewards.</p>
          </div>
        </div>

        <div className="redeem-tabs">
          <div className="tabs">
            <button className={`tab ${active === 'all' ? 'active' : ''}`} onClick={() => setActive('all')}>All Rewards <span className="count">{counts.all}</span></button>
            <button className={`tab ${active === 'unlocked' ? 'active' : ''}`} onClick={() => setActive('unlocked')}>Unlocked <span className="count">{counts.unlocked}</span></button>
            <button className={`tab ${active === 'locked' ? 'active' : ''}`} onClick={() => setActive('locked')}>Locked <span className="count">{counts.locked}</span></button>
            <button className={`tab ${active === 'coming' ? 'active' : ''}`} onClick={() => setActive('coming')}>Coming Soon <span className="count">{counts.coming}</span></button>
          </div>
        </div>
      </div>

      <div className="redeem-grid">
        {shown.length === 0 ? (
          <div className="empty">No rewards in this category.</div>
        ) : (
          shown.map((r: any) => {
            const isComing = !!r.coming_soon
            const isUnlocked = !isComing && typeof r.points === 'number' && (coins || 0) >= r.points
            return (
              <RewardCard
                key={r.id}
                reward={r}
                unlocked={isUnlocked}
                coming={isComing}
                onRedeem={() => handleRedeem(r)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

export default RedeemPage
