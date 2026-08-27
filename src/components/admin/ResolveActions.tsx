'use client'
// src/components/admin/ResolveActions.tsx
// Admin component to resolve a market as YES or NO, or delete it entirely

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResolveActionsProps {
  marketId: string
}

export function ResolveActions({ marketId }: ResolveActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'yes' | 'no' | 'delete' | null>(null)

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

  const handleDelete = async () => {
    // Confirm before permanent deletion (removes predictions + comments too)
    if (!confirm('Permanently delete this topic? This also removes all its predictions and comments. This cannot be undone.')) {
      return
    }
    setLoading('delete')
    try {
      const res = await fetch('/api/admin/markets/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete market')
      }
    } catch (error) {
      alert('Error deleting market')
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
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="btn btn-secondary"
        title="Permanently delete this topic and its predictions/comments"
        style={{
          borderColor: 'var(--danger)',
          color: 'var(--danger)',
          background: 'rgba(224, 92, 92, 0.08)',
          opacity: loading !== null ? 0.5 : 1,
          cursor: loading !== null ? 'not-allowed' : 'pointer'
        }}
      >
        {loading === 'delete' ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
