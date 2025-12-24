/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

type Toast = { id: string; message: string; type?: 'success' | 'info' | 'error' }

const ToastContext = createContext<{ addToast: (t: Omit<Toast, 'id'>) => void } | undefined>(undefined)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)

  const ensureAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
        const Ctor = win.AudioContext || win.webkitAudioContext
        if (Ctor) audioCtxRef.current = new Ctor()
      }
    } catch {
      // audio not supported or user gesture required
      audioCtxRef.current = null
    }
  }, [])

  const playTone = useCallback((type: Toast['type'] | undefined) => {
    ensureAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)
    if (type === 'success') {
      o.frequency.setValueAtTime(880, now)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.12, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    } else if (type === 'error') {
      o.frequency.setValueAtTime(220, now)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.14, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    } else {
      o.frequency.setValueAtTime(440, now)
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.08, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.30)
    }
    o.start(now)
    o.stop(now + 0.5)
  }, [ensureAudio])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const toast: Toast = { id: String(Date.now()) + Math.random().toString(36).slice(2), ...t }
    setToasts((s) => [toast, ...s])
    // play sound
    playTone(toast.type)
    // auto-remove after 4s (allow animation)
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== toast.id))
    }, 4000)
  }, [playTone])

  const removeToast = useCallback((id: string) => setToasts((s) => s.filter((t) => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type || 'info'}`} role="status">
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}