// src/app/creator/dashboard/CreatorDashboardClient.tsx
// Client-side components for Creator Dashboard

'use client'

import { useState } from 'react'

export default function CreatorDashboardClient({
  hasAccount,
  username,
}: {
  hasAccount: boolean
  username: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startOnboarding = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/creator/onboarding', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--warning)' }}>
          {error}
        </div>
      )}
      <button
        onClick={startOnboarding}
        disabled={loading}
        className="btn btn-primary"
        style={{ minWidth: '160px' }}
      >
        {loading ? 'Loading...' : hasAccount ? 'Complete Setup' : 'Start Earning'}
      </button>
    </div>
  )
}
