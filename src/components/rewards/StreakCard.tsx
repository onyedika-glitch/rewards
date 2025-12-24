import React from 'react'
import type { HubData } from '../../data/rewardsData'
import { supabase } from '../../supabaseClient'
import { useToast } from '../../contexts/ToastContext'

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const formatYMD = (d: Date) => d.toISOString().slice(0, 10)
const startOfWeekMonday = (d: Date) => {
  const copy = new Date(d)
  const jsDay = copy.getDay() // 0 (Sun) - 6 (Sat)
  const offset = (jsDay + 6) % 7 // 0 for Mon, 6 for Sun
  copy.setDate(copy.getDate() - offset)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const StreakCard: React.FC<{ streak: HubData['streak']; userId?: string; coins?: number; updateCoins?: (n:number)=>Promise<void> }> = ({ streak, userId, coins, updateCoins }) => {
  const [claimed, setClaimed] = React.useState(streak.todayClaimed || false)
  const [loading, setLoading] = React.useState(false)
  const [days, setDays] = React.useState<number>(streak.days || 0)
  const [claimedDates, setClaimedDates] = React.useState<Set<string>>(new Set())
  const { addToast } = useToast()

  React.useEffect(() => {
    setClaimed(streak.todayClaimed || false)
    setDays(streak.days || 0)
  }, [streak.todayClaimed, streak.days])

  const fetchStreakFromDb = async () => {
    if (!userId) return
    try {
      // try to read daily_claims rows for the user
      const { data, error } = await supabase
        .from('daily_claims')
        .select('claimed_date')
        .eq('user_id', userId)
        .order('claimed_date', { ascending: false })
        .limit(365)

      if (error) throw error

      const dates = new Set<string>((data || []).map((r: any) => (typeof r.claimed_date === 'string' ? r.claimed_date : formatYMD(new Date(r.claimed_date)))))
      setClaimedDates(dates)

      const todayStr = formatYMD(new Date())
      const todayClaimed = dates.has(todayStr)
      setClaimed(todayClaimed)

      // compute consecutive days ending today
      let consecutive = 0
      let cursor = new Date()
      while (dates.has(formatYMD(cursor))) {
        consecutive += 1
        cursor.setDate(cursor.getDate() - 1)
      }
      setDays(consecutive)

    } catch (err: any) {
      // fallback: try last_daily_claim on users
      console.warn('Failed to fetch daily_claims, falling back to users.last_daily_claim', err)
      try {
        const { data: u, error: uerr } = await supabase.from('users').select('last_daily_claim').eq('id', userId).single()
        if (!uerr && u) {
          const last = u.last_daily_claim
          const todayStr = formatYMD(new Date())
          const todayClaimed = last === todayStr
          setClaimed(todayClaimed)
          // can't compute consecutive reliably; keep existing days or 1 if today claimed and days was 0
          if (todayClaimed && days === 0) setDays(1)
        }
      } catch (e) {
        console.warn('Fallback users query failed', e)
      }
    }
  }

  React.useEffect(() => {
    if (userId) fetchStreakFromDb()
  }, [userId])

  const handleClaim = async () => {
    if (!userId || !updateCoins) {
      addToast({ message: 'Sign in to claim your daily points', type: 'info' })
      return
    }
    if (claimed) return
    setLoading(true)
    try {
      // Prefer server-side RPC to ensure atomicity and idempotency
      const rpcRes = await supabase.rpc('claim_daily_points', { p_user_id: userId, p_points: streak.pointsPerDay })
      if (rpcRes.error) {
        const msg = String((rpcRes.error as any).message || '')
        console.warn('claim_daily_points rpc failed, falling back to client insert', rpcRes.error)
        // fallback to direct insert (older schema)
        const today = new Date().toISOString().slice(0, 10)
        const { error: insertErr } = await supabase.from('daily_claims').insert({ user_id: userId, claimed_date: today, points: streak.pointsPerDay })
        if (insertErr) {
          const msg2 = String((insertErr as any).message || '')
          if (msg2.includes('does not exist') || (insertErr as any).status === 400 || (insertErr as any).code === '42703') {
            await supabase.from('users').update({ last_daily_claim: today }).eq('id', userId)
            // still award client-side
            const newCoins = (coins || 0) + streak.pointsPerDay
            await updateCoins(newCoins)
            setClaimed(true)
            addToast({ message: `${streak.pointsPerDay} points added (local fallback)`, type: 'success' })
            await fetchStreakFromDb()
            setLoading(false)
            return
          }
          throw insertErr
        }
        // if insert succeeded, award points and return
        const newCoins = (coins || 0) + streak.pointsPerDay
        await updateCoins(newCoins)
        setClaimed(true)
        addToast({ message: `${streak.pointsPerDay} points added (fallback)`, type: 'success' })
        await fetchStreakFromDb()
        setLoading(false)
        return
      }

      // rpcRes.data may be an array or object depending on PG/driver; normalize
      let resData: any = rpcRes.data
      if (Array.isArray(resData) && resData.length > 0) resData = resData[0]

      const claimedNow = !!resData?.claimed
      const newCoinsFromRpc = typeof resData?.new_coins === 'number' ? resData.new_coins : undefined

      if (claimedNow) {
        if (typeof newCoinsFromRpc === 'number') await updateCoins(newCoinsFromRpc)
        else await updateCoins((coins || 0) + streak.pointsPerDay)
        setClaimed(true)
        addToast({ message: `${streak.pointsPerDay} points added`, type: 'success' })
        await fetchStreakFromDb()
      } else {
        // already claimed today
        setClaimed(true)
        addToast({ message: `Daily points already claimed`, type: 'info' })
        await fetchStreakFromDb()
      }

    } catch (err) {
      console.error('Failed to claim daily points', err)
      addToast({ message: 'Failed to claim points. Try again later.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card streak-card" tabIndex={0} aria-label="Daily streak card">
      <div className="card-header">
        <div className="badge">📅</div>
        <h3>Daily Streak</h3>
      </div>
      <div className="card-body">
        <div className="streak-days">{days} day{days !== 1 ? 's' : ''}</div>
        <div className="week-indicator">
          {(() => {
            const start = startOfWeekMonday(new Date())
            const items: JSX.Element[] = []
            for (let i = 0; i < 7; i++) {
              const dt = new Date(start)
              dt.setDate(start.getDate() + i)
              const dtStr = formatYMD(dt)
              const active = claimedDates.size > 0 ? claimedDates.has(dtStr) : (i < days)
              items.push(
                <div key={i} className={`day ${active ? 'active' : ''}`}>
                  {weekdays[i]}
                </div>
              )
            }
            return items
          })()}
        </div>
        <p className="streak-note">Check in daily to earn {streak.pointsPerDay} points</p>
        <button className="btn primary" onClick={handleClaim} disabled={claimed || loading}>
          {claimed ? "Today's points claimed" : loading ? 'Claiming...' : "Claim Today's Points"}
        </button>
      </div>
    </div>
  )
}

export default StreakCard
