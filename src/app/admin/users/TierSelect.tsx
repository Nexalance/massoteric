'use client'
// src/app/admin/users/TierSelect.tsx
// Per-user tier dropdown in the admin users table.
// PATCHes /api/admin/users/tier and refreshes the server list.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubscriptionTier } from '@prisma/client'

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'var(--fog)',
  STANDARD: 'var(--gold)',
  PRO: 'var(--signal)',
}

export default function TierSelect({ userId, tier }: { userId: string; tier: SubscriptionTier }) {
  const router = useRouter()
  const [value, setValue] = useState<SubscriptionTier>(tier)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const change = async (next: SubscriptionTier) => {
    if (next === value || saving) return
    setSaving(true)
    setError(false)
    const prev = value
    setValue(next) // optimistic
    try {
      const res = await fetch('/api/admin/users/tier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier: next }),
      })
      if (!res.ok) throw new Error('failed')
      router.refresh()
    } catch {
      setValue(prev)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <select
        value={value}
        disabled={saving}
        onChange={e => change(e.target.value as SubscriptionTier)}
        style={{
          padding: '5px 8px',
          background: 'var(--ink2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: '4px',
          color: TIER_COLORS[value],
          fontSize: '12px',
          fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer',
        }}
        aria-label="Change user tier"
      >
        <option value="FREE">FREE</option>
        <option value="STANDARD">STANDARD</option>
        <option value="PRO">PRO</option>
      </select>
      {saving && <span style={{ fontSize: '10px', color: 'var(--mist)' }}>…</span>}
    </span>
  )
}
