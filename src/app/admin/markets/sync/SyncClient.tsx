'use client'

import { useState } from 'react'

export default function SyncClient() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; synced?: number; errors?: number; error?: string } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sync')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Syncing...' : 'Start Sync Now'}
      </button>

      {result && (
        <div style={{ marginTop: '24px' }}>
          {result.success ? (
            <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--signal)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <span style={{ fontWeight: 600, color: 'var(--cream)' }}>Sync Completed</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                Markets synced: <strong style={{ color: 'var(--signal)' }}>{result.synced}</strong>
                {result.errors !== undefined && result.errors > 0 && (
                  <span style={{ color: 'var(--warning)', marginLeft: '12px' }}>
                    ({result.errors} errors)
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>❌</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--error)' }}>Sync Failed</div>
                  <div style={{ fontSize: '13px', color: 'var(--mist)', marginTop: '4px' }}>
                    {result.error}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
