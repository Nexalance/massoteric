// src/app/creator/dashboard/PayoutRequestClient.tsx
// Client-side component for payout requests

'use client'

import { useState } from 'react'

interface PayoutRequestClientProps {
  availableBalance: number
  username: string
}

export default function PayoutRequestClient({
  availableBalance,
  username,
}: PayoutRequestClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [amount, setAmount] = useState<number>(Math.floor(availableBalance))

  const requestPayout = async () => {
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amount > availableBalance) {
      setError('Amount exceeds available balance')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/creator/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: Math.round(amount * 100) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payout')
      }

      setSuccess(true)
      // Refresh the page to show updated stats
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (availableBalance <= 0) {
    return (
      <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--muted)' }}>
        No balance available for payout
      </div>
    )
  }

  return (
    <div style={{ marginTop: '12px' }}>
      {error && (
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--warning)' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--success)' }}>
          ✓ Payout request submitted! Awaiting admin approval.
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            min="1"
            max={availableBalance}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Amount"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '14px',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Available: ${availableBalance.toFixed(2)}
          </div>
        </div>
        <button
          onClick={requestPayout}
          disabled={loading}
          className="btn btn-primary"
          style={{ minWidth: '120px' }}
        >
          {loading ? 'Requesting...' : 'Request'}
        </button>
      </div>
    </div>
  )
}
