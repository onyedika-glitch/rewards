import React from 'react'
import type { EarnMore } from '../../data/rewardsData'

const EarnMoreCard: React.FC<{ item: EarnMore }> = ({ item }) => {
  // choose explicit icons per card id: e-1 -> star, e-2 -> share
  const icon = (() => {
    if (item.id === 'e-1') {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 17.3l6.18 3.87-1.64-7.03L21 9.24l-7.19-.62L12 2 10.19 8.62 3 9.24l4.46 4.9-1.64 7.03L12 17.3z" fill="#7c3aed" />
        </svg>
      )
    }

    if (item.id === 'e-2') {
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 12v2a2 2 0 0 0 2 2h.01" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 7v2a2 2 0 0 1-2 2h-.01" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.59 13.51l6.82-3.02" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="6" r="2" fill="#fff" stroke="#7c3aed" strokeWidth="1.2" />
          <circle cx="18" cy="18" r="2" fill="#fff" stroke="#7c3aed" strokeWidth="1.2" />
        </svg>
      )
    }

    // fallback icon
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12h14" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    )
  })()


  const cta = item.id.includes('refer') ? 'Refer' : 'Share'

  return (
    <div className="card earn-card" tabIndex={0} aria-label={item.title}>
      <div className="card-header">
        <div className="badge" aria-hidden>{icon}</div>
        <h3>{item.title}</h3>
      </div>

      <div className="card-body">
        <p className="earn-desc">{item.description}</p>
        <div className="earn-actions">
          <button className="btn outline small" aria-label={cta}>{cta}</button>
        </div>
      </div>
    </div>
  )
}

export default EarnMoreCard
