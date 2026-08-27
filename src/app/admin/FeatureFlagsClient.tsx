'use client'
// src/app/admin/FeatureFlagsClient.tsx
// Interactive Free/Paid toggle for feature flags on the admin dashboard.
// PATCHes /api/admin/flags and reflects the new state optimistically.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Flag {
  key: string
  label: string
  description: string
  isFree: boolean
}

export default function FeatureFlagsClient({ initialFlags }: { initialFlags: Flag[] }) {
  const router = useRouter()
  const [flags, setFlags] = useState<Flag[]>(initialFlags)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggle = async (key: string) => {
    const current = flags.find(f => f.key === key)
    if (!current || busyKey) return

    const newIsFree = !current.isFree
    setBusyKey(key)
    setError(null)

    // Optimistic update
    setFlags(prev => prev.map(f => (f.key === key ? { ...f, isFree: newIsFree } : f)))

    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, isFree: newIsFree }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed (${res.status})`)
      }
      router.refresh()
    } catch (e) {
      // Revert on failure
      setFlags(prev => prev.map(f => (f.key === key ? { ...f, isFree: current.isFree } : f)))
      setError(e instanceof Error ? e.message : 'Failed to update feature')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
        Toggle features between Free and Paid. Changes take effect immediately for all users.
      </p>
      {error && (
        <div style={{ padding: '10px 12px', marginBottom: '12px', background: 'rgba(224,92,92,0.1)', border: '1px solid var(--danger)', borderRadius: '4px', fontSize: '12px', color: 'var(--danger)' }}>
          {error}
        </div>
      )}
      {flags.map((flag, i) => (
        <div key={flag.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < flags.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{flag.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>{flag.description}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: flag.isFree ? 'var(--signal)' : 'var(--gold)', letterSpacing: '1px' }}>
              {busyKey === flag.key ? 'SAVING…' : flag.isFree ? 'FREE' : 'PAID'}
            </span>
            <button
              type="button"
              aria-label={`Toggle ${flag.label}`}
              disabled={busyKey === flag.key}
              onClick={() => toggle(flag.key)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: flag.isFree ? 'var(--signal)' : 'var(--fog)',
                border: 'none', cursor: busyKey === flag.key ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', padding: '0 3px',
                justifyContent: flag.isFree ? 'flex-end' : 'flex-start',
                transition: 'background 0.15s ease, justify-content 0.15s ease',
                opacity: busyKey === flag.key ? 0.6 : 1,
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
