import React, { useState } from 'react'
import { useAuth } from '../../AuthContext'
import { useReferral } from '../../hooks/useReferral'
import { useToast } from '../../contexts/ToastContext'
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 1H4a2 2 0 0 0-2 2v12" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="8" y="5" width="13" height="13" rx="2" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SocialIcon = ({ type }: { type: 'facebook' | 'x' | 'linkedin' | 'whatsapp' }) => {
  if (type === 'facebook')
    return <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12H22z"/></svg>
  if (type === 'x') return <svg viewBox="0 0 24 24" width="20" height="20" fill="#000"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
  if (type === 'linkedin') return <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M4.98 3.5C4.98 5 3.7 6.1 2 6.1c-1.7 0-2.98-1.1-2.98-2.6C-. . ."/></svg>
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M21 3a2 2 0 0 0-2.8-.5L8 9.3 5 8l-1 3 8 1A9 9 0 0 0 21 3z"/></svg>
}

const ReferralSection: React.FC = () => {
  const { user } = useAuth()
  const { data, loading, error, refresh } = useReferral(user?.id)
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const link = data?.link || ''

  // Prefer referral link from data, then from auth user metadata, then construct from email or user id
  const userMeta: any = (user as any)?.user_metadata || {}
  const profileReferralCode = userMeta.referral_code || userMeta.referralLink || userMeta.referral_link
  const profileReferralFrom = profileReferralCode ? `https://app.flowvahub.com/signup/?ref=${profileReferralCode}` : undefined
  const inferredFromEmail = user?.email ? `https://app.flowvahub.com/signup/?ref=${encodeURIComponent((user.email || '').split('@')[0])}` : undefined
  const computedReferralLink = link || profileReferralFrom || inferredFromEmail || (user ? `https://app.flowvahub.com/signup/?ref=${user.id}` : '')
  const prevRef = React.useRef<{ referrals: number; points: number } | null>(null)

  React.useEffect(() => {
    if (!loading && data) {
      if (prevRef.current) {
        const prev = prevRef.current
        if (data.referrals !== prev.referrals) {
          const diff = (data.referrals || 0) - (prev.referrals || 0)
          addToast({ message: `Referral count updated (${diff})`, type: 'info' })
        }
        if ((data.pointsEarned || 0) !== (prev.points || 0)) {
          const diff = (data.pointsEarned || 0) - (prev.points || 0)
          addToast({ message: `Referral points updated (${diff})`, type: 'success' })
        }
      }
      prevRef.current = { referrals: data.referrals || 0, points: data.pointsEarned || 0 }
    }
  }, [data, loading, addToast])
  const copy = async () => {
    if (!computedReferralLink) return
    try {
      await navigator.clipboard.writeText(computedReferralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // fallback
      const el = document.createElement('textarea')
      el.value = computedReferralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const share = (platform: 'facebook' | 'x' | 'linkedin' | 'whatsapp') => {
    const linkToShare = computedReferralLink || 'https://app.flowvahub.com'
    const url = encodeURIComponent(linkToShare)
    const text = encodeURIComponent('Join Flowwa — earn points and build faster!')
    let shareUrl = ''
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'x':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}%20${url}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        break
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`
        break
    }
    // If we're using a fallback, inform the user briefly
    if (!computedReferralLink) addToast({ message: 'Sharing site (no referral link available)', type: 'info' })
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  // Always render the card but show inline states
  return (
    <section className="refer-section">
      <div className="refer-header">
        <span className="refer-bar" />
        <h3>Refer & Earn</h3>
      </div>

      {error && <div className="refer-error">Error loading referral info: {error}</div>}
      {loading && <div className="refer-loading">Loading referral info…</div>}

      <div className="refer-banner">
        <div className="refer-banner-left">🔗</div>
        <div className="refer-banner-right">
          <div className="refer-banner-title">Share Your Link</div>
          <div className="refer-banner-sub">{data?.note || 'Invite friends and earn 25 points when they join'}</div>
        </div>
      </div>

      <div className="refer-stats centered">
        <div>
          <div className="stat-number big">{data?.referrals ?? 0}</div>
          <div className="stat-label">Referrals</div>
        </div>
        <div>
          <div className="stat-number big">{data?.pointsEarned ?? 0}</div>
          <div className="stat-label">Points Earned</div>
        </div>
      </div>

      <div className="referral-card pink">
        <label className="sr-only" htmlFor="ref-link">Your personal referral link</label>
        <input id="ref-link" readOnly value={computedReferralLink} className="ref-input pink-input" />
        <button className="copy-btn purple" onClick={copy} aria-live="polite" disabled={!computedReferralLink}>
          <CopyIcon />
        </button>
      </div>

      <div className="share-row icons">
        <button className="social fb" onClick={() => share('facebook')} aria-label="Share on Facebook" title="Share on Facebook">f</button>
        <button className="social x" onClick={() => share('x')} aria-label="Share on X" title="Share on X">x</button>
        <button className="social in" onClick={() => share('linkedin')} aria-label="Share on LinkedIn" title="Share on LinkedIn">in</button>
        <button className="social wa" onClick={() => share('whatsapp')} aria-label="Share on WhatsApp" title="Share on WhatsApp">wa</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <button className="btn small outline" onClick={refresh}>Refresh</button>
      </div>
    </section>
  )
}

export default ReferralSection