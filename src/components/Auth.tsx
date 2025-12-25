import React, { useState, useMemo } from 'react'
import { useAuth } from '../AuthContext'
import '../App.css'
import './Auth.css'
import { supabase } from '../supabaseClient'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const passwordStrength = (p: string) => {
  let score = 0
  if (p.length >= 8) score += 1
  if (/[A-Z]/.test(p)) score += 1
  if (/[0-9]/.test(p)) score += 1
  if (/[^A-Za-z0-9]/.test(p)) score += 1
  return Math.min(4, score)
}

const strengthWidth = (score: number) => `${(score / 4) * 100}%`

const Auth: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { signUp, signIn } = useAuth()

  // Track a lightweight responsive flag so we can adapt layout and test breakpoint behavior
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 720 : false)
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 720)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const emailError = useMemo(() => {
    if (!email) return null
    if (!emailRe.test(email)) return 'Please enter a valid email address'
    return null
  }, [email])

  const pwdScore = useMemo(() => passwordStrength(password), [password])
  const pwdError = useMemo(() => {
    if (!password) return null
    if (password.length < 8) return 'Password must be at least 8 characters'
    return null
  }, [password])

  const canSubmit = !emailError && !pwdError && !!email && !!password

  // Confirmation flow removed: signup will immediately attempt to sign in the user.
  // (Server-side email confirmation is not enforced by the client.)
  // NOTE: If your auth provider strictly requires email confirmation, sign-in may still fail.
  // In that case adjust your provider settings or add a server-side auto-confirm hook.
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError('Please fix the form errors before continuing')
      return
    }
    setLoading(true)
    try {
      if (isSignUp) {
        // After signup, immediately attempt to sign in.
        await signUp(email, password)
        try {
          await signIn(email, password)
        } catch (e) {
          // Sign-in after signup failed (could be due to server-side confirmation rules).
          // Surface an error but do not enter a confirmation UI — user can try signing in manually.
          console.warn('Sign-in after signup failed', e)
          setError('Sign-up succeeded but automatic sign-in failed. Please try signing in or check auth settings.')
        }
      } else {
        await signIn(email, password)
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // When confirmation is sent, show a special view until the user confirms via email




  return (
    <div className={`auth-card ${isMobile ? 'is-mobile' : ''}`} role="region" aria-label="Authentication">
      <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label className="field-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            placeholder="you@company.com"
            required
          />
          {emailError ? <div id="email-error" className="error">{emailError}</div> : null}
        </div>

        <div className="form-row">
          <div className="inline-row">
            <label className="field-label">Password</label>
            <div className="small">{isSignUp ? 'Create a strong password' : 'Enter your password'}</div>
          </div>

          <div className="row-with-button">
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!pwdError}
              aria-describedby={pwdError ? 'pwd-error' : 'pwd-help'}
              placeholder="Minimum 8 characters"
              required
            />
            <button type="button" className="show-btn" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div id="pwd-help" className="help">
            <div className="strength" aria-hidden>
              <i style={{ width: strengthWidth(pwdScore) }} />
            </div>
            {pwdError ? <div id="pwd-error" className="error">{pwdError}</div> : pwdScore >= 3 ? <div className="field-success">Strong password</div> : null}
          </div>
        </div>

        <button className="primary-btn" type="submit" disabled={loading || !canSubmit} aria-disabled={loading || !canSubmit}>
          {loading ? <span className="spinner" aria-hidden /> : null}
          <span style={{ marginLeft: loading ? 8 : 0 }}>{isSignUp ? 'Create account' : 'Sign in'}</span>
        </button>
      </form>

      {error && <div className="error" role="alert" style={{ marginTop: 12 }}>{error}</div>}

      <button className="alt-btn" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
      </button>
    </div>
  )
}

export default Auth