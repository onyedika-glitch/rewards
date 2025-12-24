import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Avoid StrictMode double-mount during development to prevent double side-effects and FOUC
const rootEl = document.getElementById('root')!

if (import.meta.env.DEV) {
  // In dev we render without StrictMode to avoid intentional double-mounts which can
  // cause visible flashes when components create side-effects on mount.
  createRoot(rootEl).render(<App />)
} else {
  // Keep StrictMode in non-dev builds for safety checks
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Remove the placeholder after first paint to prevent FOUC in dev
const placeholder = document.getElementById('root-placeholder')
if (placeholder) {
  requestAnimationFrame(() => {
    placeholder.classList.add('fade-out')
    setTimeout(() => placeholder.remove(), 400)
  })
}
