'use client'

import { useState } from 'react'

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'iran', label: 'Iran' },
  { value: 'politics', label: 'Politics' },
  { value: 'finance', label: 'Finance' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'sports', label: 'Sports' },
  { value: 'tech', label: 'Tech' },
  { value: 'science', label: 'Science' },
  { value: 'economy', label: 'Economy' },
  { value: 'geopolitics', label: 'Geopolitics' },
  { value: 'culture', label: 'Culture' },
  { value: 'weather', label: 'Weather' },
  { value: 'elections', label: 'Elections' },
]

export default function SyncClient() {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    synced?: number
    errors?: number
    category?: string
    subcategoryCounts?: Record<string, number>
    error?: string
  } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const url = category ? `/api/sync?category=${category}` : '/api/sync'
      const response = await fetch(url)
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
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--mist)', marginBottom: '8px' }}>
          Select Category to Sync
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--cream)',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSync}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Syncing...' : category ? `Sync ${CATEGORIES.find(c => c.value === category)?.label}` : 'Start Sync Now'}
      </button>

      {result && (
        <div style={{ marginTop: '24px' }}>
          {result.success ? (
            <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--signal)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <span style={{ fontWeight: 600, color: 'var(--cream)' }}>
                  {result.category ? `Sync Completed: ${result.category}` : 'Sync Completed'}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--mist)' }}>
                Markets synced: <strong style={{ color: 'var(--signal)' }}>{result.synced}</strong>
                {result.errors !== undefined && result.errors > 0 && (
                  <span style={{ color: 'var(--warning)', marginLeft: '12px' }}>
                    ({result.errors} errors)
                  </span>
                )}
              </div>
              {result.subcategoryCounts && Object.keys(result.subcategoryCounts).length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '8px' }}>Subcategory counts:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(result.subcategoryCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([slug, count]) => (
                        <span
                          key={slug}
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: 'var(--mist)',
                          }}
                        >
                          {slug}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}
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
