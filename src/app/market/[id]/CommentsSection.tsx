'use client'
// src/app/market/[id]/CommentsSection.tsx
// Threaded discussion under a topic. Visibility and posting are driven by
// the admin COMMENTS_VIEW / COMMENTS_CREATE feature flags, so discussions
// can be switched off entirely or restricted to paid subscribers.

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface CommentNode {
  id: string
  parentId: string | null
  body: string
  isDeleted: boolean
  createdAt: string
  author: { username: string | null; displayName: string; tier: string | null } | null
  score: number
  replies?: CommentNode[]
}

interface CommentsSectionProps {
  marketId: string
}

const replyIndent = { borderLeft: '2px solid var(--border)', paddingLeft: '14px', marginTop: '12px' }

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  return formatDistanceToNow(new Date(t), { addSuffix: true })
}

function countComments(list: CommentNode[]): number {
  if (!Array.isArray(list)) return 0
  return list.reduce((sum, c) => sum + 1 + (Array.isArray(c.replies) ? countComments(c.replies) : 0), 0)
}

function CommentCard({
  comment,
  depth,
  canCreate,
  onReply,
}: {
  comment: CommentNode
  depth: number
  canCreate: boolean
  onReply: (c: CommentNode) => void
}) {
  return (
    <div style={depth > 0 ? replyIndent : undefined}>
      <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>
            {comment.author?.displayName || 'Deleted user'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--mist)', whiteSpace: 'nowrap' }}>{timeAgo(comment.createdAt)}</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--cream)', lineHeight: '1.6', margin: '8px 0 0', userSelect: 'text', WebkitUserSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {comment.body}
        </p>
        {canCreate && !comment.isDeleted && (
          <button
            onClick={() => onReply(comment)}
            style={{
              background: 'none', border: 'none', padding: '6px 0 0', cursor: 'pointer',
              fontSize: '12px', color: 'var(--gold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
            }}
          >
            ↩ Reply
          </button>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(r => (
            <CommentCard key={r.id} comment={r} depth={depth + 1} canCreate={canCreate} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentsSection({ marketId }: CommentsSectionProps) {
  const [state, setState] = useState<{
    featureEnabled: boolean
    canView: boolean
    canCreate: boolean
    comments: CommentNode[]
  } | null>(null)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/markets/${marketId}/comments`)
      const data = await res.json()
      setState({
        featureEnabled: !!data.featureEnabled,
        canView: !!data.canView,
        canCreate: !!data.canCreate,
        comments: Array.isArray(data.comments) ? data.comments : [],
      })
      if (typeof data.signedIn === 'boolean') setSignedIn(data.signedIn)
    } catch {
      setState({ featureEnabled: false, canView: false, canCreate: false, comments: [] })
    }
  }

  useEffect(() => { load() }, [marketId])

  // Master switch off — render nothing at all
  if (!state?.featureEnabled) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch(`/api/markets/${marketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, parentId: replyTo?.id || null }),
      })
      if (res.status === 201) {
        setDraft('')
        setReplyTo(null)
        await load()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to post comment')
      }
    } catch {
      setError('Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const total = countComments(state.comments)
  const placeholder = replyTo
    ? `Reply to ${replyTo.author?.displayName || 'comment'}…`
    : 'Add to the discussion…'

  return (
    <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
      <div className="section-label" style={{ marginBottom: '16px' }}>
        Discussion {total > 0 && `(${total})`}
      </div>

      {/* Flag on but viewing is paid-only — upsell instead of the thread */}
      {!state.canView && (
        <div style={{
          padding: '20px', textAlign: 'center', background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.25)', borderRadius: '6px',
        }}>
          <p style={{ color: 'var(--mist)', fontSize: '14px', margin: '0 0 12px', lineHeight: '1.6' }}>
            💬 Discussions are available to Standard &amp; Pro subscribers.
          </p>
          <Link href="/settings/billing" className="btn btn-primary" style={{ fontSize: '12px', padding: '10px 22px' }}>
            Upgrade to Join the Discussion
          </Link>
        </div>
      )}

      {state.canView && (
        <>
          {state.canCreate ? (
            <form onSubmit={submit} style={{ marginBottom: '20px' }}>
              {replyTo && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '12px', color: 'var(--gold)', marginBottom: '6px',
                }}>
                  <span>↩ Replying to {replyTo.author?.displayName || 'comment'}</span>
                  <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--mist)', cursor: 'pointer', fontSize: '12px' }}>
                    cancel
                  </button>
                </div>
              )}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={placeholder}
                rows={3}
                maxLength={2000}
                className="input"
                style={{ minHeight: '80px', resize: 'vertical', userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '6px 0 0' }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--mist)' }}>{draft.length}/2000</span>
                <button
                  type="submit"
                  disabled={posting || !draft.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '8px 18px', opacity: posting || !draft.trim() ? 0.5 : 1, cursor: !draft.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {posting ? 'Posting…' : replyTo ? 'Post Reply' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            signedIn === false && (
              <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '16px' }}>
                <Link href="/sign-in" style={{ color: 'var(--gold)' }}>Sign in</Link> to join the discussion.
              </p>
            )
          )}

          {state.comments.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--mist)', fontStyle: 'italic' }}>
              No comments yet — be the first to weigh in.
            </p>
          ) : (
            <div>
              {state.comments.map(c => (
                <CommentCard
                  key={c.id}
                  comment={c}
                  depth={0}
                  canCreate={state.canCreate}
                  onReply={(target) => {
                    setReplyTo(target)
                    setDraft('')
                    setError(null)
                    window.scrollTo({ top: window.scrollY - 200, behavior: 'smooth' })
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
