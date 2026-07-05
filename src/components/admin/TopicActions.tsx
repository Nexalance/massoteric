'use client'
// src/components/admin/TopicActions.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopicActionsProps {
  topicId: string
}

export function TopicActions({ topicId }: TopicActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(status === 'APPROVED' ? 'approve' : 'reject')
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, status }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to update topic status')
      }
    } catch (error) {
      alert('Error updating topic')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => handleAction('REJECTED')}
        disabled={loading !== null}
        className="btn btn-secondary"
        style={{
          borderColor: 'var(--danger)',
          color: 'var(--danger)',
          opacity: loading !== null ? 0.5 : 1,
          cursor: loading !== null ? 'not-allowed' : 'pointer'
        }}
      >
        {loading === 'reject' ? 'Rejecting...' : 'Reject'}
      </button>
      <button
        onClick={() => handleAction('APPROVED')}
        disabled={loading !== null}
        className="btn btn-primary"
        style={{
          opacity: loading !== null ? 0.5 : 1,
          cursor: loading !== null ? 'not-allowed' : 'pointer'
        }}
      >
        {loading === 'approve' ? 'Approving...' : 'Approve → Live'}
      </button>
    </div>
  )
}
