import React from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import Auth from './components/Auth'
import RewardsPage from './components/RewardsPage'
import RedeemPage from './components/RedeemPage'
import Sidebar from './components/Sidebar'
import { ToastProvider } from './contexts/ToastContext'
import './App.css'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-live="polite">
        Loading...
      </div>
    )
  }

  const [page, setPage] = React.useState(() => (window.location.hash === '#redeem' ? 'redeem' : 'rewards'))

  React.useEffect(() => {
    const onHash = () => setPage(window.location.hash === '#redeem' ? 'redeem' : 'rewards')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [isMobile, setIsMobile] = React.useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 900 : false)
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth > 900 : true))

  React.useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 900
      setIsMobile(mobile)
      if (!mobile) setSidebarOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  React.useEffect(() => {
    // prevent background scroll when mobile sidebar is open
    if (isMobile && sidebarOpen) document.body.classList.add('no-scroll')
    else document.body.classList.remove('no-scroll')
  }, [isMobile, sidebarOpen])

  return (
    <div className={user ? 'app rewards' : 'app auth'}>
      {user ? (
        <div className="app-layout">
          <Sidebar isMobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* mobile overlay */}
          {isMobile && sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <main className="main-content">
            {/* hamburger button for small screens */}
            <button className="hamburger-btn" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>

            {page === 'rewards' && <RewardsPage />}
            {page === 'redeem' && <RedeemPage />}
          </main>
        </div>
      ) : (
        <Auth />
      )}
    </div>
  )
}

const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AuthProvider>
)

export default App
