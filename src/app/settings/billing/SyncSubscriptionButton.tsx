'use client'

import { useState } from 'react'

export function SyncSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/billing/sync', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to sync subscription' })
        return
      }

      setMessage({ type: 'success', text: data.message || 'Subscription synced!' })

      // Refresh the page after a short delay to show updated info
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unexpected error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="btn btn-secondary"
        style={{
          padding: '8px 16px',
          fontSize: '11px',
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'wait' : 'pointer',
        }}
      >
        {isLoading ? 'Syncing...' : 'Sync Subscription'}
      </button>
      {message && (
        <div style={{
          fontSize: '11px',
          marginTop: '8px',
          color: message.type === 'success' ? 'var(--signal)' : 'var(--danger)',
        }}>
          {message.text}
        </div>
      )}
    </>
  )
}
