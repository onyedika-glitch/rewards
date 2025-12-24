import React, { useRef, useEffect } from 'react'

// InteractiveCard: subtle cursor-aware animation (CSS variables) + touch support.
// Respects prefers-reduced-motion.
const InteractiveCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return // avoid animations for users who prefer reduced motion

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.setProperty('--mx', String(x.toFixed(3)))
      el.style.setProperty('--my', String(y.toFixed(3)))
      el.style.setProperty('--scale', '1.02')
    }

    const onLeave = () => {
      el.style.setProperty('--mx', '0')
      el.style.setProperty('--my', '0')
      el.style.setProperty('--scale', '1')
    }

    const onTouchStart = () => {
      el.style.setProperty('--scale', '1.02')
    }
    const onTouchEnd = () => onLeave()

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return (
    <div ref={ref} className={`interactive-card ${className}`} tabIndex={0} aria-hidden>
      {children}
    </div>
  )
}

export default InteractiveCard