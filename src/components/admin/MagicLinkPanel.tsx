'use client'
// src/components/admin/MagicLinkPanel.tsx
// Generate / revoke / inspect the time-limited reviewer access link.
// The full URL is shown once at generation — only its hash is stored.

import { useEffect, useState } from 'react'

interface LinkStatus {
  id: string
  label: string
  createdAt: string
  expiresAt: string
  expired: boolean
}

export function MagicLinkPanel() {
  const [link, setLink] = useState<LinkStatus | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [days, setDays] = useState(7)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'generate' | 'revoke' | null>(null)

  useEffect(() => {
    fetch('/api/admin/dev-access')
      .then(res => (res.ok ? res.json() : { link: null }))
      .then(data => setLink(data.link))
      .catch(() => setLink(null))
      .finally(() => setLoaded(true))
  }, [])

  const generate = async () => {
    setBusy('generate')
    setGeneratedUrl(null)
    setCopied(false)
    try {
      const res = await fetch('/api/admin/dev-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: days }),
      })
      if (res.ok) {
        const data = await res.json()
        setLink(data.link)
        setGeneratedUrl(`${window.location.origin}${data.path}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const revoke = async () => {
    setBusy('revoke')
    try {
      const res = await fetch('/api/admin/dev-access', { method: 'DELETE' })
      if (res.ok) {
        setLink(null)
        setGeneratedUrl(null)
      }
    } finally {
      setBusy(null)
    }
  }

  const copy = async () => {
    if (!generatedUrl) return
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* clipboard unavailable — URL stays visible to copy manually */ }
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString()

  return (
    <div>
      <div className="section-label">Reviewer Access Link</div>
      <div className="card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--mist)', lineHeight: '1.6', marginBottom: '16px' }}>
          One time-limited URL that opens the site in a full admin session — no password shared.
          Anyone with the link has <strong style={{ color: 'var(--cream)' }}>real admin powers</strong>,
          so share it only with reviewers and revoke it when the review ends.
        </p>

        {!loaded ? (
          <p style={{ fontSize: '13px', color: 'var(--mist)' }}>Loading…</p>
        ) : (
          <>
            <div style={{ fontSize: '13px', marginBottom: '14px' }}>
              {link ? (
                link.expired ? (
                  <span style={{ color: 'var(--warning)' }}>⏱ Last link expired on {fmt(link.expiresAt)}</span>
                ) : (
                  <span style={{ color: 'var(--signal)' }}>
                    ● Active — <span style={{ color: 'var(--cream)' }}>{link.label}</span> · expires {fmt(link.expiresAt)}
                  </span>
                )
              ) : (
                <span style={{ color: 'var(--mist)' }}>No active reviewer link.</span>
              )}
            </div>

            {generatedUrl && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-mono)', letterSpacing: '1px', marginBottom: '6px' }}>
                  COPY THIS LINK NOW — IT IS SHOWN ONLY ONCE
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <input
                    readOnly
                    value={generatedUrl}
                    onFocus={e => e.currentTarget.select()}
                    style={{ flex: 1, padding: '10px 12px', fontSize: '12px', fontFamily: 'var(--font-mono)', border: '1px solid var(--fog)', borderRadius: '4px', background: 'var(--ink2)', color: 'var(--cream)' }}
                  />
                  <button
                    type="button"
                    onClick={copy}
                    style={{ padding: '10px 18px', fontSize: '12px', border: '1px solid var(--fog)', borderRadius: '4px', background: 'var(--ink2)', color: 'var(--cream)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '12px', color: 'var(--mist)', fontFamily: 'var(--font-mono)' }}>
                Expires in{' '}
                <select
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  style={{ padding: '8px 10px', fontSize: '13px', border: '1px solid var(--fog)', borderRadius: '4px', background: 'var(--ink2)', color: 'var(--cream)', marginLeft: '6px' }}
                >
                  <option value={1}>1 day</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </label>
              <button
                type="button"
                onClick={generate}
                disabled={busy !== null}
                className="btn btn-primary"
                style={{ opacity: busy ? 0.6 : 1 }}
              >
                {busy === 'generate' ? 'Generating…' : link ? 'Generate New Link (revokes old)' : 'Generate Link'}
              </button>
              {link && !link.expired && (
                <button
                  type="button"
                  onClick={revoke}
                  disabled={busy !== null}
                  className="btn btn-secondary"
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)', opacity: busy ? 0.6 : 1 }}
                >
                  {busy === 'revoke' ? 'Revoking…' : 'Revoke Now'}
                </button>
              )}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--fog)', marginTop: '14px', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
              Generating revokes the previous link automatically (one active at a time).
              Revoking kills reviewer sessions on their very next click.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
