import React from 'react'
import { render, screen } from '@testing-library/react'
import Auth from '../Auth'
import { describe, it, expect, beforeEach } from 'vitest'

function resizeTo(width: number) {
  // jsdom: set innerWidth and dispatch resize
  ;(window as any).innerWidth = width
  window.dispatchEvent(new Event('resize'))
}

describe('Auth responsive behavior', () => {
  beforeEach(() => {
    // Reset width
    resizeTo(1024)
  })

  it('adds is-mobile class when viewport is small', () => {
    resizeTo(400)
    const { container } = render(<Auth />)
    const root = container.querySelector('.auth-card')
    expect(root).toBeTruthy()
    expect(root?.classList.contains('is-mobile')).toBe(true)
  })

  it('does not add is-mobile on wide viewports', () => {
    resizeTo(1200)
    const { container } = render(<Auth />)
    const root = container.querySelector('.auth-card')
    expect(root).toBeTruthy()
    expect(root?.classList.contains('is-mobile')).toBe(false)
  })
})