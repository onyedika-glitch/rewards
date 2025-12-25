import React from 'react'

const items = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'library', label: 'Library' },
  { id: 'tech', label: 'Tech Stack' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'rewards', label: 'Rewards Hub' },
  { id: 'settings', label: 'Settings' },
]

const Sidebar: React.FC<{ active?: string; isMobile?: boolean; open?: boolean; onClose?: () => void }> = ({ active = 'rewards', isMobile: isMobileProp, open = true, onClose }) => {
  const [isMobileState, setIsMobileState] = React.useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 900 : false)
  React.useEffect(() => {
    if (typeof isMobileProp === 'undefined') {
      const onResize = () => setIsMobileState(window.innerWidth <= 900)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    } else {
      setIsMobileState(Boolean(isMobileProp))
    }
  }, [isMobileProp])

  const isMobile = isMobileState
  const classes = ['sidebar']
  if (isMobile) classes.push('is-mobile')
  if (open) classes.push('open')
  else classes.push('collapsed')
  return (
    <aside className={classes.join(' ')} aria-hidden={isMobile && !open}>
      {isMobile && (
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          ✕
        </button>
      )}
      <div className="brand">Flowwa</div>
      <nav>
        {items.map((it) => (
          <div key={it.id} className={`nav-item ${it.id === active ? 'active' : ''}`}>
            {it.label}
          </div>
        ))}
      </nav>
      <div className="user-summary">Omogo</div>
    </aside>
  )
}

export default Sidebar
