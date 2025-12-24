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

  return (
    <div className={user ? 'app rewards' : 'app auth'}>
      {user ? (
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
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
