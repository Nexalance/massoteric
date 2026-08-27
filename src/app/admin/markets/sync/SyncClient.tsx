'use client'

import { useState } from 'react'

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'politics', label: 'Politics' },
  { value: 'sports', label: 'Sports' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'iran', label: 'Iran' },
  { value: 'finance', label: 'Finance' },
  { value: 'geopolitics', label: 'Geopolitics' },
  { value: 'tech', label: 'Tech' },
  { value: 'culture', label: 'Culture' },
  { value: 'economy', label: 'Economy' },
  { value: 'weather', label: 'Weather' },
  { value: 'elections', label: 'Elections' },
]

export default function SyncClient() {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  // Category-level busy lock: after a sync starts for X, that category's sync stays
  // disabled until page reload (per requirement — intentional, not persisted server-side).
  const [syncedCategories, setSyncedCategories] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{
    success: boolean
    synced?: number
    errors?: number
    category?: string
    mode?: string
    message?: string
    error?: string
  } | null>(null)

  const currentCategorySynced = category !== '' && syncedCategories.has(category)

  const handleSync = async () => {
    // No category picked → guide the user instead of hitting the API
    if (!category) {
      setResult({
        success: false,
        error: 'Please select a category from the dropdown above first. Choose one category (e.g., Politics or Sports) — you can run each category separately.',
      })
      return
    }

    // Already synced this category since page load → blocked until reload
    if (syncedCategories.has(category)) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/sync?category=${category}`)
      const data = await response.json()
      setResult(data)
      // Lock this category after a successful start (until page reload)
      if (data.success) {
        setSyncedCategories(prev => new Set(prev).add(category))
      }
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
        disabled={loading || currentCategorySynced}
        className="btn btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          opacity: currentCategorySynced ? 0.6 : 1,
          cursor: currentCategorySynced ? 'not-allowed' : 'pointer',
        }}
      >
        {currentCategorySynced
          ? `Sync Already Started for ${CATEGORIES.find(c => c.value === category)?.label} — Reload Page to Run Again`
          : loading
            ? 'Starting...'
            : category
              ? `Sync ${CATEGORIES.find(c => c.value === category)?.label}`
              : 'Select a Category to Start Sync'}
      </button>

      {result && (
        <div style={{ marginTop: '24px' }}>
          {result.success ? (
            result.mode === 'background' ? (
              <div style={{ padding: '16px', background: 'rgba(79, 195, 161, 0.08)', border: '1px solid var(--signal)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🚀</span>
                  <span style={{ fontWeight: 600, color: 'var(--cream)' }}>
                    Sync Started: {result.category}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--mist)', lineHeight: '1.6' }}>
                  The sync is now running in the background — it may take <strong style={{ color: 'var(--cream)' }}>2–5 minutes</strong> to complete.
                </div>
                <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '13px', color: 'var(--mist)', lineHeight: '1.8' }}>
                  <li>Please wait ~5 minutes before checking the data.</li>
                  <li>The sync button for this category is now disabled to prevent duplicate syncs. It re-enables after a page reload.</li>
                  <li>If results look unchanged, refresh the markets page after a few minutes.</li>
                </ul>
              </div>
            ) : (
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
              </div>
            )
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
