'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface AutoSyncSubscriptionProps {
  onSyncComplete: (newTier: string) => void
  paymentCanceled?: boolean
}

export function AutoSyncSubscription({ onSyncComplete, paymentCanceled }: AutoSyncSubscriptionProps) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // If payment was canceled, show message (handled via prop from server)
    if (paymentCanceled) {
      setMessage('Subscription canceled. You can upgrade anytime!')
      setStatus('error')
      return
    }

    const success = searchParams.get('success')

    if (success === 'true') {
      // Auto-sync subscription when returning from successful Stripe payment
      // Note: The server-side sync already happened in page.tsx
      // This is a client-side fallback/feedback mechanism
      syncSubscription()
    }
  }, [searchParams, paymentCanceled])

  const syncSubscription = async () => {
    setStatus('syncing')
    setMessage('Syncing your subscription...')

    try {
      const response = await fetch('/api/billing/sync', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Failed to sync subscription')
        setStatus('error')
        return
      }

      // Success!
      setMessage(data.message || `Welcome to ${data.subscriptionTier}! 🎉`)
      setStatus('success')

      // Notify parent component
      if (data.subscriptionTier) {
        onSyncComplete(data.subscriptionTier)
      }

      // Remove success param from URL (clean URL)
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      window.history.replaceState({}, '', url.toString())

      // Refresh page after showing success message
      setTimeout(() => {
        window.location.reload()
      }, 2500)

    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to sync subscription')
      setStatus('error')
    }
  }

  if (status === 'idle') {
    return null
  }

  return (
    <div style={{
      marginBottom: '24px',
      padding: '16px 20px',
      borderRadius: '8px',
      border: `2px solid ${
        status === 'syncing' ? 'var(--gold)' :
        status === 'success' ? 'var(--signal)' :
        'var(--danger)'
      }`,
      background: status === 'syncing'
        ? 'rgba(201, 168, 76, 0.1)'
        : status === 'success'
        ? 'rgba(79, 195, 161, 0.1)'
        : 'rgba(224, 92, 92, 0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {status === 'syncing' && (
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--gold)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        )}
        {status === 'success' && (
          <div style={{ fontSize: '24px' }}>✅</div>
        )}
        {status === 'error' && (
          <div style={{ fontSize: '24px' }}>⚠️</div>
        )}
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: status === 'syncing' ? 'var(--gold)' :
                   status === 'success' ? 'var(--signal)' :
                   'var(--danger)',
          }}>
            {status === 'syncing' ? 'Processing Payment...' :
             status === 'success' ? 'Payment Successful!' :
             'Payment Notice'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '4px' }}>
            {message}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
