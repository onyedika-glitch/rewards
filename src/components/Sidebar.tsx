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

const Sidebar: React.FC<{ active?: string }> = ({ active = 'rewards' }) => {
  return (
    <aside className="sidebar">
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
