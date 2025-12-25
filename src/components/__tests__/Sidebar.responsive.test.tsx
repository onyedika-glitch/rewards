import React from 'react'
import { render } from '@testing-library/react'
import Sidebar from '../Sidebar'
import { describe, it, expect } from 'vitest'

function resizeTo(width: number) {
  ;(window as any).innerWidth = width
  window.dispatchEvent(new Event('resize'))
}

describe('Sidebar responsive behavior', () => {
  it('adds is-mobile class when viewport <= 900', () => {
    resizeTo(800)
    const { container } = render(<Sidebar />)
    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).toBeTruthy()
    expect(sidebar?.classList.contains('is-mobile')).toBe(true)
  })

  it('does not add is-mobile class on wide viewports', () => {
    resizeTo(1200)
    const { container } = render(<Sidebar />)
    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).toBeTruthy()
    expect(sidebar?.classList.contains('is-mobile')).toBe(false)
  })
})