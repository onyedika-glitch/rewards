import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RewardsHub from './RewardsHub'

describe('RewardsHub', () => {
  it('renders the header and sections', () => {
    render(<RewardsHub />)
    expect(screen.getByRole('heading', { name: /Rewards Hub/i })).toBeDefined()
    expect(screen.getByText(/Your Rewards Journey/i)).toBeDefined()
    expect(screen.getByText(/Earn More Points/i)).toBeDefined()
  })
})
