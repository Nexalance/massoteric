'use client'
// src/components/admin/TopicActions.tsx
// Approve / Edit / Reject-with-reason controls for the admin topic queue.

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface TopicActionsTopic {
  title: string
  description: string | null
  resolutionCriteria: string | null
  closesAt: string | Date | null
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time
function toLocalInputValue(value: string | Date | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fieldLabel = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--mist)',
  fontFamily: 'var(--font-mono)',
}

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  border: '1px solid var(--fog)',
  borderRadius: '4px',
  background: 'var(--ink)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
}

export function TopicActions({ topicId, topic }: { topicId: string; topic: TopicActionsTopic }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | 'save' | null>(null)
  const [mode, setMode] = useState<'edit' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Editable copies (seeded when the admin opens the editor)
  const [title, setTitle] = useState(topic.title)
  const [description, setDescription] = useState(topic.description || '')
  const [criteria, setCriteria] = useState(topic.resolutionCriteria || '')
  const [closesAt, setClosesAt] = useState(toLocalInputValue(topic.closesAt))
  const [rejectionReason, setRejectionReason] = useState('')

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/topics', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, ...payload }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to update topic')
    }
  }

  const handleApprove = async () => {
    setLoading('approve')
    setError(null)
    try {
      await patch({ status: 'APPROVED' })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error approving topic')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    setError(null)
    try {
      await patch({ status: 'REJECTED', rejectionReason: rejectionReason.trim() || undefined })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error rejecting topic')
    } finally {
      setLoading(null)
    }
  }

  const handleSaveEdits = async () => {
    setLoading('save')
    setError(null)
    try {
      await patch({
        edits: {
          title,
          description: description.trim() || null,
          resolutionCriteria: criteria,
          ...(closesAt ? { closesAt: new Date(closesAt).toISOString() } : {}),
        },
      })
      setMode(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving edits')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '0 0 8px' }}>{error}</p>
      )}

      {mode === null && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('reject')}
            disabled={loading !== null}
            className="btn btn-secondary"
            style={{
              borderColor: 'var(--danger)',
              color: 'var(--danger)',
              opacity: loading !== null ? 0.5 : 1,
              cursor: loading !== null ? 'not-allowed' : 'pointer'
            }}
          >
            Reject
          </button>
          <button
            onClick={() => setMode('edit')}
            disabled={loading !== null}
            className="btn btn-secondary"
            style={{ opacity: loading !== null ? 0.5 : 1 }}
          >
            Edit
          </button>
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="btn btn-primary"
            style={{
              opacity: loading !== null ? 0.5 : 1,
              cursor: loading !== null ? 'not-allowed' : 'pointer'
            }}
          >
            {loading === 'approve' ? 'Approving...' : 'Approve → Live'}
          </button>
        </div>
      )}

      {mode === 'reject' && (
        <div style={{ width: '100%' }}>
          <label style={fieldLabel}>Why isn&apos;t this topic approved? (sent to the creator)</label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="e.g. The resolution criteria has no source or date — add where and when YES/NO is decided, then resubmit."
            rows={3}
            maxLength={1000}
            style={{ ...fieldStyle, resize: 'vertical', marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setMode(null); setRejectionReason(''); setError(null) }}
              disabled={loading !== null}
              className="btn btn-secondary"
              style={{ opacity: loading !== null ? 0.5 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="btn btn-secondary"
              style={{
                borderColor: 'var(--danger)',
                color: 'var(--danger)',
                opacity: loading !== null ? 0.5 : 1,
                cursor: loading !== null ? 'not-allowed' : 'pointer'
              }}
            >
              {loading === 'reject' ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={fieldLabel}>Topic Question</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} minLength={10} maxLength={300} style={fieldStyle} />
          </div>
          <div>
            <label style={fieldLabel}>Resolution Criteria</label>
            <textarea value={criteria} onChange={e => setCriteria(e.target.value)} minLength={20} maxLength={1000} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={fieldLabel}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={fieldLabel}>Closing Date</label>
            <input
              type="datetime-local"
              value={closesAt}
              onChange={e => setClosesAt(e.target.value)}
              style={{ ...fieldStyle, colorScheme: 'dark' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setMode(null); setError(null) }}
              disabled={loading !== null}
              className="btn btn-secondary"
              style={{ opacity: loading !== null ? 0.5 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdits}
              disabled={loading !== null || title.length < 10 || criteria.length < 20}
              className="btn btn-primary"
              style={{ opacity: loading !== null || title.length < 10 || criteria.length < 20 ? 0.5 : 1 }}
            >
              {loading === 'save' ? 'Saving...' : 'Save Edits'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
