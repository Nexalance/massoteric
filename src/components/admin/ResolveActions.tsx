'use client'
// src/components/admin/ResolveActions.tsx
// Admin component to resolve a market as YES or NO

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResolveActionsProps {
  marketId: string
}

export function ResolveActions({ marketId }: ResolveActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'yes' | 'no' | null>(null)

  const handleResolve = async (outcome: boolean) => {
    setLoading(outcome ? 'yes' : 'no')
    try {
      const res = await fetch('/api/admin/markets/resolve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, outcome }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to resolve market')
      }
    } catch (error) {
      alert('Error resolving market')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => handleResolve(false)}
        disabled={loading !== null}
        className="btn btn-secondary"
        style={{
          borderColor: 'var(--danger)',
          color: 'var(--danger)',
          opacity: loading !== null ? 0.5 : 1,
          cursor: loading !== null ? 'not-allowed' : 'pointer'
        }}
      >
        {loading === 'no' ? 'Resolving...' : 'Resolve NO'}
      </button>
      <button
        onClick={() => handleResolve(true)}
        disabled={loading !== null}
        className="btn btn-primary"
        style={{
          background: 'var(--signal)',
          borderColor: 'var(--signal)',
          opacity: loading !== null ? 0.5 : 1,
          cursor: loading !== null ? 'not-allowed' : 'pointer'
        }}
      >
        {loading === 'yes' ? 'Resolving...' : 'Resolve YES'}
      </button>
    </div>
  )
}
