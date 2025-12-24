import { supabase } from '../supabaseClient'
import type { Session } from '@supabase/supabase-js'

type SessionCallback = (session: Session | null) => void

const listeners = new Set<SessionCallback>()
let subscription: { unsubscribe?: () => void } | null = null

function ensureSubscription() {
  if (subscription) return
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listeners.forEach((cb) => cb(session))
  })
  subscription = data?.subscription || null
}

export function subscribeToAuth(cb: SessionCallback) {
  listeners.add(cb)
  ensureSubscription()

  return () => {
    listeners.delete(cb)
    if (listeners.size === 0 && subscription) {
      try {
        subscription.unsubscribe()
      } catch {
        // best-effort cleanup
      }
      subscription = null
    }
  }
}