'use client'

import { useState, FormEvent } from 'react'

interface BillingFormProps {
  tier: string
  planName: string
  color: string
}

export function BillingForm({ tier, planName, color }: BillingFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('tier', tier)

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to create checkout session')
        return
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="tier" value={tier} />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
        style={{
          width: '100%',
          justifyContent: 'center',
          background: color,
          borderColor: color,
          opacity: isLoading ? 0.7 : 1,
          cursor: isLoading ? 'wait' : 'pointer',
        }}
      >
        {isLoading ? 'Redirecting to Stripe...' : `Upgrade to ${planName}`}
      </button>
      {error && (
        <div style={{ color: 'var(--signal)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </form>
  )
}
