import React from 'react'

const IconSvg: React.FC<{ name?: string }> = ({ name }) => {
  switch (name) {
    case 'bank':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="2" y="7" width="20" height="3" rx="1" fill="#F5E6FF" stroke="#E9D5FF" />
          <path d="M4 10v6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 10v6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 10v6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'paypal':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 7h6l-1 6H7z" fill="#E8F5FF" stroke="#BFDBFE" />
          <path d="M9 7h6l-1 6H10z" fill="#DCEFFF" stroke="#93C5FD" />
        </svg>
      )
    case 'visa':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="3" width="20" height="14" rx="2" fill="#FFF5F7" stroke="#FDE7F3" />
          <text x="12" y="13" fontSize="9" textAnchor="middle" fill="#A78BFA">VISA</text>
        </svg>
      )
    case 'apple':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#FFF7ED" stroke="#FEF3C7" />
          <path d="M12 8c1-1 2-1 3-1 0 1-1 3-3 3s-2-2-3-3c1 0 2 0 3 1z" fill="#A78BFA" />
        </svg>
      )
    case 'play':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#FFFBEB" stroke="#FEF3C7" />
          <path d="M10 8v8l6-4-6-4z" fill="#7C3AED" />
        </svg>
      )
    case 'amazon':
    case 'amazon10':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="4" width="18" height="14" rx="3" fill="#F8F5FF" stroke="#F3E8FF" />
          <path d="M7 14s1 1 5 1 6-1 6-1" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'udemy':
      return (
        <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="#F3E8FF" stroke="#EDE9FE" />
          <path d="M7 14c2-2 6-2 8 0" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    default:
      return <div aria-hidden>🎁</div>
  }
}

const RewardCard: React.FC<{
  reward: any
  unlocked?: boolean
  coming?: boolean
  onRedeem?: () => void
}> = ({ reward, unlocked = false, coming = false, onRedeem }) => {
  return (
    <div className={`redeem-card card ${coming ? 'coming' : ''}`} tabIndex={0} aria-label={`Reward ${reward.title}`}>
      <div className="card-image">
        <div className="image-placeholder"><IconSvg name={reward.iconKey} /></div>
      </div>
      <div className="card-body">
        <div className="offer-meta">
          <div className="offer-title">{reward.title}</div>
          <div className="offer-desc">{reward.description}</div>
        </div>

        <div className="offer-footer">
          <div className="cost">⭐ <span className="cost-number">{reward.points ?? '—'}</span> pts</div>
          <div className="actions">
            {coming ? (
              <button className="btn" disabled>Coming Soon</button>
            ) : unlocked ? (
              <button className="btn primary" onClick={onRedeem}>Redeem</button>
            ) : (
              <button className="btn locked" disabled>Locked</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardCard
