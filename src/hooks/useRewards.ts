import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import type { Reward, Redemption } from '../types'

export const useRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRewards = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('rewards').select('*')
      if (error) throw error
      // Do not show static sample rewards here; rely on DB rows only
      setRewards(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  return { rewards, loading, error }
}

export const useRedemptions = (userId: string) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRedemptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*, reward:rewards(*)')
        .eq('user_id', userId)
      if (error) throw error
      setRedemptions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch redemptions')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchRedemptions()
  }, [userId, fetchRedemptions])

  return { redemptions, loading, error }
}

export const useUserCoins = (userId: string) => {
  const [coins, setCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCoins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('coins')
        .eq('id', userId)
        .single()
      if (error) throw error
      setCoins(data.coins)
    } catch (err) {
      console.error('Failed to fetch coins:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchCoins()
  }, [userId, fetchCoins])

  const updateCoins = async (newCoins: number) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ coins: newCoins })
        .eq('id', userId)
      if (error) throw error
      setCoins(newCoins)
    } catch (err) {
      console.error('Failed to update coins:', err)
    }
  }

  return { coins, loading, updateCoins }
}