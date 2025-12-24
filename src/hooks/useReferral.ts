import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export type ReferralData = {
  link: string
  referrals: number
  pointsEarned: number
  note?: string
}

export const useReferral = (userId?: string) => {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Keep a channel reference so we can unsubscribe on cleanup
    let channel: any = null

    if (userId) {
      fetchReferral()

      // Setup realtime listeners: updates to the referrals table for this user
      // and also changes to the user's row (in case referral info is stored there).
      try {
        channel = supabase
          .channel(`realtime:referrals:user:${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'referrals', filter: `user_id=eq.${userId}` },
            () => {
              fetchReferral()
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
            () => {
              fetchReferral()
            }
          )
          .subscribe()
      } catch (err) {
        console.warn('Failed to setup referral realtime subscription', err)
      }
    } else {
      setLoading(false)
    }

    return () => {
      if (channel) {
        try {
          // Remove the channel to clean up resources
          supabase.removeChannel(channel)
        } catch (e) {
          console.warn('Failed to remove realtime channel', e)
        }
      }
    }
    // We only want to re-run this effect when userId changes; fetchReferral is intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchReferral = async () => {
    setLoading(true)
    try {
      // First, try the users table (safer and more common schema)
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('referral_link, referrals, referral_points')
        .eq('id', userId)
        .maybeSingle()

      if (userErr) {
        console.warn('useReferral: users query error, will try referrals table as fallback', userErr)
      }

      if (userData) {
        setData({
          link: userData.referral_link || '',
          referrals: userData.referrals || 0,
          pointsEarned: userData.referral_points || 0,
        })
        setLoading(false)
        return
      }

      // Users table doesn't have referral info; try referrals table but be tolerant of 400/column errors
      try {
        const res = await supabase.from('referrals').select('*').eq('user_id', userId)
        if (res.error) {
          const msg = String((res.error as any)?.message || '')
          console.warn('useReferral: referrals query warning', res.error)
          if (msg.includes('does not exist') || (res.error as any)?.status === 400 || (res.error as any)?.code === '42703') {
            // Schema mismatch; report but do not throw — fall back to empty data
            console.warn("useReferral: 'referrals' table schema mismatch (missing expected column), returning fallback data")
            setData({ link: '', referrals: 0, pointsEarned: 0 })
            setLoading(false)
            return
          }
          throw res.error
        }

        if (Array.isArray(res.data)) {
          const rows: any[] = res.data
          const count = rows.length
          const points = rows.reduce((s, r) => s + (r.points || r.points_earned || 0), 0)
          setData({ link: rows[0]?.link || '', referrals: count, pointsEarned: points, note: rows[0]?.note || undefined })
          setLoading(false)
          return
        }
      } catch (e) {
        console.error('useReferral: error while querying referrals table', e)
        setData({ link: '', referrals: 0, pointsEarned: 0 })
        setLoading(false)
        return
      }

      // If nothing found, set defaults
      setData({ link: '', referrals: 0, pointsEarned: 0 })
    } catch (err) {
      console.error('useReferral: failed to fetch referral data', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch referral data')
      setData({ link: '', referrals: 0, pointsEarned: 0 })
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => fetchReferral()

  return { data, loading, error, refresh }
}
