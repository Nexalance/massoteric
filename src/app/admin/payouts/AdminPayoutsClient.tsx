// src/app/admin/payouts/AdminPayoutsClient.tsx
// Client-side component for admin payout management

'use client'

import { useState } from 'react'

interface Payout {
  id: string
  amountCents: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  requestedAt: Date
  processedAt: Date | null
  notes: string | null
  stripeTransferId: string | null
  user: {
    id: string
    username: string
    displayName: string | null
    email: string | null
    stripeAccountId: string | null
  }
}

interface AdminPayoutsClientProps {
  payouts: Payout[]
}

export default function AdminPayoutsClient({ payouts }: AdminPayoutsClientProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})
  const [showRejectionForm, setShowRejectionForm] = useState<Record<string, boolean>>({})

  const processPayout = async (payoutId: string, action: 'approve' | 'reject') => {
    setLoading(prev => ({ ...prev, [payoutId]: true }))
    setError(prev => ({ ...prev, [payoutId]: '' }))
    setSuccess(prev => ({ ...prev, [payoutId]: false }))

    try {
      const notes = action === 'reject' ? rejectionNotes[payoutId] : undefined

      const response = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payout')
      }

      setSuccess(prev => ({ ...prev, [payoutId]: true }))
      setShowRejectionForm(prev => ({ ...prev, [payoutId]: false }))

      // Refresh after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(prev => ({
        ...prev,
        [payoutId]: err instanceof Error ? err.message : 'Something went wrong'
      }))
    } finally {
      setLoading(prev => ({ ...prev, [payoutId]: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--warning)'
      case 'PROCESSING': return 'var(--info)'
      case 'COMPLETED': return 'var(--success)'
      case 'FAILED': return 'var(--error)'
      default: return 'var(--muted)'
    }
  }

  const pending = payouts.filter(p => p.status === 'PENDING')
  const others = payouts.filter(p => p.status !== 'PENDING')

  return (
    <div>
      {/* Pending Payouts - Need Action */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            Pending Approval ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.map(payout => (
              <div
                key={payout.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>
                        ${payout.amountCents / 100}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg)',
                          color: getStatusColor(payout.status),
                          textTransform: 'uppercase',
                        }}
                      >
                        {payout.status.toLowerCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
                      {payout.user.displayName || payout.user.username || payout.user.email}
                      {payout.user.stripeAccountId ? (
                        <span style={{ color: 'var(--success)', marginLeft: '8px' }}>✓ Stripe Connected</span>
                      ) : (
                        <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>⚠ No Stripe Account</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Requested: {new Date(payout.requestedAt).toLocaleDateString()}
                    </div>
                    {payout.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        {payout.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {showRejectionForm[payout.id] ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={rejectionNotes[payout.id] || ''}
                          onChange={(e) => setRejectionNotes(prev => ({ ...prev, [payout.id]: e.target.value }))}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            fontSize: '13px',
                            width: '200px',
                          }}
                        />
                        <button
                          onClick={() => processPayout(payout.id, 'reject')}
                          disabled={loading[payout.id] || !payout.user.stripeAccountId}
                          className="btn btn-secondary"
                          style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                          {loading[payout.id] ? '...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => setShowRejectionForm(prev => ({ ...prev, [payout.id]: false }))}
                          className="btn btn-secondary"
                          style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowRejectionForm(prev => ({ ...prev, [payout.id]: true }))}
                          className="btn btn-secondary"
                          style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => processPayout(payout.id, 'approve')}
                          disabled={loading[payout.id] || !payout.user.stripeAccountId}
                          className="btn btn-primary"
                          style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                          {loading[payout.id] ? '...' : 'Approve'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {error[payout.id] && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--error)' }}>
                    {error[payout.id]}
                  </div>
                )}
                {success[payout.id] && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--success)' }}>
                    ✓ {payout.status === 'PENDING' ? 'Payout approved and processing' : 'Payout rejected'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Other Payouts */}
      {others.length > 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            All Payouts ({others.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {others.map(payout => (
              <div
                key={payout.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  opacity: 0.7,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '500' }}>
                        ${payout.amountCents / 100}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'var(--bg)',
                          color: getStatusColor(payout.status),
                          textTransform: 'uppercase',
                        }}
                      >
                        {payout.status.toLowerCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                      {payout.user.displayName || payout.user.username}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
                    <div>Requested: {new Date(payout.requestedAt).toLocaleDateString()}</div>
                    {payout.processedAt && (
                      <div>Processed: {new Date(payout.processedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payouts.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--muted)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
        }}>
          No payouts yet
        </div>
      )}
    </div>
  )
}
