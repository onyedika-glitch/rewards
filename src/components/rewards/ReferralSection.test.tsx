import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../hooks/useReferral', () => ({
  useReferral: (userId?: string) => ({ data: { link: 'https://example.com/ref', referrals: 3, pointsEarned: 75, note: 'Invite friends!' }, loading: false, error: null, refresh: () => {} })
}))

vi.mock('../../AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@example.com' } })
}))

import ReferralSection from './ReferralSection'

describe('ReferralSection', () => {
  it('renders referral data when present', () => {
    render(<ReferralSection />)
    expect(screen.getByText(/Refer & Earn/i)).toBeDefined()
    expect(screen.getByText(/Referrals/i)).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByDisplayValue(/https:\/\/example.com\/ref/)).toBeDefined()
  })
})
