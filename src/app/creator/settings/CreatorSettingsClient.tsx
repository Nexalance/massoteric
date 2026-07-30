// src/app/creator/settings/CreatorSettingsClient.tsx
// Client-side form for updating creator settings

'use client'

import { useState } from 'react'

export default function CreatorSettingsClient({
  initialSettings,
  isOnboarded,
}: {
  initialSettings: { monthlyPrice: number; platformFeePercent: number }
  isOnboarded: boolean
}) {
  const [monthlyPrice, setMonthlyPrice] = useState(initialSettings.monthlyPrice)
  const [platformFeePercent, setPlatformFeePercent] = useState(initialSettings.platformFeePercent)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/creator/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyPriceCents: Math.round(monthlyPrice * 100),
          platformFeeBps: Math.round(platformFeePercent * 100),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }

      setMessage({ type: 'success', text: 'Settings updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Monthly Price */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          MONTHLY SUBSCRIPTION PRICE
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', color: 'var(--cream)' }}>$</span>
          <input
            type="number"
            min="1"
            max="999"
            step="0.01"
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
            disabled={!isOnboarded || loading}
            style={{
              width: '100px',
              padding: '10px 12px',
              fontSize: '18px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--cream)',
            }}
          />
          <span style={{ fontSize: '14px', color: 'var(--mist)' }}>per month</span>
        </div>
      </div>

      {/* Platform Fee */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--mist)', marginBottom: '6px' }}>
          PLATFORM FEE PERCENTAGE
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={platformFeePercent}
            onChange={(e) => setPlatformFeePercent(parseFloat(e.target.value) || 0)}
            disabled={!isOnboarded || loading}
            style={{
              width: '80px',
              padding: '10px 12px',
              fontSize: '16px',
              backgroundColor: 'var(--ink)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--cream)',
            }}
          />
          <span style={{ fontSize: '14px', color: 'var(--mist)' }}>%</span>
          <span style={{ fontSize: '12px', color: 'var(--gold)', marginLeft: '8px' }}>
            (You keep {100 - platformFeePercent}%)
          </span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 12px',
            fontSize: '13px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 146, 60, 0.1)',
            color: message.type === 'success' ? 'var(--signal)' : 'var(--warning)',
            border: `1px solid ${message.type === 'success' ? 'var(--signal)' : 'var(--warning)'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={!isOnboarded || loading}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      {!isOnboarded && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--mist)', textAlign: 'center' }}>
          Complete Stripe onboarding to change pricing
        </div>
      )}
    </form>
  )
}
