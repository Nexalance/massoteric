// src/app/profile/[username]/SubscribeButton.tsx
// Functional subscribe button with Stripe checkout

'use client'

import { useState } from 'react'
import { UserSubscription } from '@prisma/client'

interface SubscribeButtonProps {
  creatorId: string
  creatorUsername: string
  monthlyPrice: number
  hasStripeAccount: boolean
  isOnboarded: boolean
  existingSubscription: UserSubscription | null
}

export default function SubscribeButton({
  creatorId,
  creatorUsername,
  monthlyPrice,
  hasStripeAccount,
  isOnboarded,
  existingSubscription,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/subscribe/${creatorId}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  // If user is already subscribed and active
  if (existingSubscription?.status === 'ACTIVE') {
    return (
      <button
        className="btn btn-secondary"
        disabled
        style={{ opacity: 0.6 }}
      >
        ✓ Subscribed
      </button>
    )
  }

  // If creator hasn't set up subscriptions yet
  if (!hasStripeAccount || !isOnboarded) {
    return (
      <button
        className="btn btn-secondary"
        disabled
        style={{ opacity: 0.6 }}
      >
        Subscriptions Not Available
      </button>
    )
  }

  return (
    <div>
      {error && (
        <div
          style={{
            marginBottom: '8px',
            fontSize: '11px',
            color: 'var(--warning)',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Loading...' : `Subscribe $${monthlyPrice}/mo`}
      </button>
    </div>
  )
}
