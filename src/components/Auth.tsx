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

  const [confirmationSent, setConfirmationSent] = useState(false)
  const skipConfirm = import.meta.env.VITE_AUTH_SKIP_CONFIRM === 'true'

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
        await signUp(email, password)
        if (skipConfirm) {
          // trial mode: immediately sign the user in without waiting for email confirmation
          try {
            await signIn(email, password)
          } catch (e) {
            // log and fall back to confirmation flow if sign-in failed
            console.warn('auto sign-in after signup failed', e)
            setConfirmationSent(true)
          }
        } else {
          setConfirmationSent(true)
          // start polling for confirmation (handled in useEffect below)
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
  React.useEffect(() => {
    if (!confirmationSent) return
    let stopped = false
    let attempts = 0

    // Realtime subscription to user_events table (fired by our webhook)
    const channel = supabase
      .channel('user-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_events' }, (payload) => {
        try {
          const newRow = payload?.new
          if (!newRow) return
          const p = newRow.payload || {}
          if (p.email === email && newRow.type === 'email_confirmed') {
            // auto sign-in if possible
            (async () => {
              try {
                await signIn(email, password)
                stopped = true
                setConfirmationSent(false)
                setError(null)
              } catch (e) {
                console.warn('auto sign-in via webhook event failed', e)
                // leave to manual check
              }
            })()
          }
        } catch (e) {
          console.warn('event handling error', e)
        }
      })
      .subscribe()

    // fallback: polling every 4s (keeps previous behavior)
    const iv = setInterval(async () => {
      attempts += 1
      try {
        const { data, error } = await supabase
          .from('users')
          .select('email_confirmed_at')
          .eq('email', email)
          .single()
        if (error) {
          // stop polling if table is not accessible
          console.warn('poll check error', error)
          return
        }
        if (data?.email_confirmed_at) {
          stopped = true
          clearInterval(iv)
          try {
            await signIn(email, password)
            setConfirmationSent(false)
            setError(null)
          } catch (e) {
            console.warn('auto sign-in failed', e)
          }
        }
        // stop after 30 attempts (~2 minutes)
        if (attempts > 30 && !stopped) {
          clearInterval(iv)
          setError('Timed out waiting for email confirmation. Please check your inbox or click "I have confirmed".')
        }
      } catch (err) {
        console.warn('polling error', err)
      }
    }, 4000)

    return () => {
      clearInterval(iv)
      try { supabase.removeChannel(channel) } catch (e) { /* ignore */ }
    }
  }, [confirmationSent, email, password, signIn])

  if (confirmationSent) {
    return (
      <div className="auth-card" role="region" aria-label="Confirm your email">
        <h2>Confirm your email</h2>
        <p className="help">We sent a confirmation message to <strong>{email}</strong>. Please click the confirmation link in that email to activate your account.</p>
        <p className="help">This page will automatically continue once you confirm. You can also click the button below after confirming.</p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="small">Waiting for confirmation...</span>
          <span className="spinner" aria-hidden />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            className="primary-btn"
            onClick={async () => {
              setLoading(true)
              setError(null)
              try {
                // check confirmation on demand
                const { data, error } = await supabase
                  .from('users')
                  .select('email_confirmed_at')
                  .eq('email', email)
                  .single()
                if (error) throw error
                if (data?.email_confirmed_at) {
                  // auto sign-in after confirmation
                  await signIn(email, password)
                  setConfirmationSent(false)
                  setError(null)
                  setConfirmationSent(false)
                  setError(null)
                } else {
                  setError('Email not confirmed yet. Please check your inbox.')
                }
              } catch (err: any) {
                setError(err?.message || 'Failed to check confirmation')
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? <span className="spinner" /> : 'I have confirmed'}
          </button>

          <button
            className="alt-btn"
            onClick={() => {
              setConfirmationSent(false)
            }}
          >
            Back
          </button>
        </div>

        {error && <div className="error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="auth-card" role="region" aria-label="Authentication">
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