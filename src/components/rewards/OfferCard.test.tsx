import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OfferCard from './OfferCard'
import { supabase } from '../../supabaseClient'

vi.mock('../../supabaseClient', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ error: null, data: null }),
    from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), match: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null }) , insert: vi.fn().mockResolvedValue({ error: null }) }))
  }
}))

const sampleOffer = {
  id: 'offer-1',
  title: 'Test Offer',
  description: 'Test description',
  points: 25,
  ctaText: 'Claim 25 pts',
  image: 'https://example.com/img.jpg',
  url: 'https://example.com/signup'
}

describe('OfferCard', () => {
  it('renders image and buttons', () => {
    render(<OfferCard offer={sampleOffer} />)
    expect(screen.getByRole('img')).toBeDefined()
    expect(screen.getByText(/Sign up/i)).toBeDefined()
    expect(screen.getByText(/Claim 25 pts/i)).toBeDefined()
  })

  it('calls updateCoins when claim clicked and rpc succeeds', async () => {
    const updateCoins = vi.fn().mockResolvedValue(undefined)
    render(<OfferCard offer={sampleOffer} coins={10} updateCoins={updateCoins} />)

    const claimBtn = screen.getByRole('button', { name: /Claim offer/i })
    fireEvent.click(claimBtn)

    // wait for updateCoins call inside async handler
    await new Promise((r) => setTimeout(r, 20))
    expect(updateCoins).toHaveBeenCalledWith(35)
    expect(supabase.rpc).toHaveBeenCalledWith('claim_offer', { user_id: undefined, offer_id: sampleOffer.id })
  })

  it('opens sign up url when sign up clicked', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null as unknown as Window)
    render(<OfferCard offer={sampleOffer} />)

    const signUpBtn = screen.getByRole('button', { name: /Sign up for offer/i })
    fireEvent.click(signUpBtn)

    expect(open).toHaveBeenCalledWith(sampleOffer.url, '_blank', 'noopener,noreferrer')
    open.mockRestore()
  })
})