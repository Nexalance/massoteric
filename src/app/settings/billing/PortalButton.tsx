'use client'

import { useState } from 'react'

export function PortalButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to open billing portal')
        return
      }

      // If response is a redirect, data.url might not exist
      // The API might return JSON with url or redirect directly
      // Let's handle both cases
      if (data.url) {
        window.location.href = data.url
      } else {
        // If no URL in response, the response might be the redirect itself
        // Try to get the URL from response headers or just redirect to billing
        window.location.href = '/settings/billing'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="btn btn-secondary"
        disabled={isLoading}
        style={{
          width: '100%',
          justifyContent: 'center',
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'wait' : 'pointer',
        }}
      >
        {isLoading ? 'Opening Stripe Portal...' : 'Manage Subscription'}
      </button>
      {error && (
        <div style={{ color: 'var(--signal)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  )
}
