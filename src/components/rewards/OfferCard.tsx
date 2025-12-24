import React, { useState } from 'react'
import type { Offer } from '../../data/rewardsData'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../AuthContext'
import { useToast } from '../../contexts/ToastContext'

const OfferCard: React.FC<{ offer?: Offer; coins?: number; updateCoins?: (n: number) => Promise<void> }> = ({ offer, coins, updateCoins }) => {
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { user } = useAuth()
  const { addToast } = useToast()

  if (!offer) return null

  const handleSignUp = () => {
    if (offer.url) window.open(offer.url, '_blank', 'noopener,noreferrer')
    else window.open('about:blank', '_blank')
  }

  const fallbackClaim = async (userId: string) => {
    // Check if already claimed
    const { data: existing, error: existingErr } = await supabase
      .from('offer_claims')
      .select('*')
      .match({ user_id: userId, offer_id: offer.id })
      .maybeSingle()

    if (existingErr) throw existingErr
    if (existing) {
      setClaimed(true)
      setMessage('Offer already claimed')
      addToast({ message: 'Offer already claimed', type: 'info' })
      return false
    }

    // Insert claim record and update user coins
    const { error: insertErr } = await supabase.from('offer_claims').insert({ user_id: userId, offer_id: offer.id, points: offer.points })
    if (insertErr) throw insertErr

    return true
  }

  const handleClaim = async () => {
    if (!user || !updateCoins) {
      setMessage('Sign in to claim this offer')
      setTimeout(() => setMessage(null), 2500)
      return
    }

    if (claimed) return

    setClaiming(true)
    try {
      // Try RPC first (server-side validation and award)
      const rpcRes = await supabase.rpc('claim_offer', { user_id: user.id, offer_id: offer.id })
      if (rpcRes.error) {
        // RPC failed, fallback to client-side check+insert
        const ok = await fallbackClaim(user.id)
        if (!ok) return
      }

      // If we reach here, award points locally
      const newCoins = (coins || 0) + offer.points
      await updateCoins(newCoins)
      setClaimed(true)
      addToast({ message: `Claimed ${offer.points} pts`, type: 'success' })
      setMessage(`${offer.points} points added`)
      setTimeout(() => setMessage(null), 2500)
    } catch (err) {
      console.error('Failed to claim offer', err)
      setMessage('Failed to claim. Try again.')
      addToast({ message: 'Failed to claim offer', type: 'error' })
      setTimeout(() => setMessage(null), 2500)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div className="card offer-card" tabIndex={0} aria-label="Featured offer card">
      <div className="card-header">
        <div className="badge">⭐</div>
        <h3>Top Tool Spotlight</h3>
      </div>
      <div className="card-image" aria-hidden>
        {offer.image ? (
          <img src={offer.image} alt={offer.title} className="offer-thumb" loading="lazy" />
        ) : (
          <div className="image-placeholder" role="img" aria-label={offer.title}>
            Image
          </div>
        )}
      </div>
      <div className="card-body">
        <h3 className="offer-title">{offer.title}</h3>
        <p className="offer-desc">{offer.description}</p>
        <div className="offer-actions">
          <button className="btn outline" onClick={handleSignUp} aria-label="Sign up for offer">
            Sign up
          </button>
          <button className="btn primary" onClick={handleClaim} disabled={claiming || claimed} aria-label="Claim offer">
            {claiming ? 'Claiming...' : claimed ? 'Claimed' : offer.ctaText}
          </button>
        </div>
        {message && <div className="claim-message">{message}</div>}
      </div>
    </div>
  )
}

export default OfferCard
