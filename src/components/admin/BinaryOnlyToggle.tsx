'use client'
// src/components/admin/BinaryOnlyToggle.tsx
// Admin switch for the yes/no-only feed mode (SIMPLE_BINARY_ONLY flag).
// PATCHes the existing /api/admin/flags endpoint (isEnabled is supported
// there); optimistic UI with rollback on failure.

import { useState } from 'react'

export function BinaryOnlyToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    const next = !enabled
    setBusy(true)
    setEnabled(next) // optimistic
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'SIMPLE_BINARY_ONLY', isEnabled: next }),
      })
      if (!res.ok) setEnabled(!next) // rollback
    } catch {
      setEnabled(!next) // rollback
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ padding: '16px 20px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>
            Show Only Yes/No Topics
          </div>
          <div style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
            {enabled
              ? 'Feed and ticker show only simple yes/no topics. Group brackets, scalar counts and price-target markets are hidden (not deleted).'
              : 'All markets are visible, including multi-outcome groups and scalar counts — prediction may not be possible on those.'}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={enabled}
          style={{
            width: '58px',
            height: '30px',
            borderRadius: '15px',
            border: 'none',
            background: enabled ? 'var(--signal)' : 'var(--fog)',
            cursor: busy ? 'wait' : 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: enabled ? '31px' : '3px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--ink)',
              transition: 'left 0.2s',
            }}
          />
        </button>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px', marginTop: '10px', color: enabled ? 'var(--signal)' : 'var(--gold)' }}>
        {busy ? 'SAVING…' : enabled ? 'ON — YES/NO TOPICS ONLY' : 'OFF — SHOWING EVERYTHING'}
      </div>
    </div>
  )
}
