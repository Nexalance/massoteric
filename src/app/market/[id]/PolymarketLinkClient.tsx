'use client'
// src/app/market/[id]/PolymarketLinkClient.tsx
// "View on Polymarket" link + data freshness timestamp.
// All synced markets come from polymarket.com, and polymarket.us hosts a
// DIFFERENT market set (.com slugs 404 there), so we always link .com:
//   slug known  → https://polymarket.com/event/{slug}
//   no slug     → legacy stored externalUrl (numeric event id)

import { formatDistanceToNow } from 'date-fns'

interface Props {
  externalUrl: string
  source: string
  marketSlug?: string | null
  marketTitle: string
  updatedAt?: Date | string | null
}

export default function PolymarketLinkClient({ externalUrl, source, marketSlug, updatedAt }: Props) {
  const isPolymarket = source === 'POLYMARKET'

  let href = externalUrl
  if (isPolymarket && marketSlug) {
    href = `https://polymarket.com/event/${marketSlug}`
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px',
            background: 'rgba(201, 168, 76, 0.12)',
            border: '1px solid var(--gold)',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            color: 'var(--gold)',
            textDecoration: 'none',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.color = 'var(--ink)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201, 168, 76, 0.12)'; e.currentTarget.style.color = 'var(--gold)' }}
        >
          VIEW ON {source.replace('_', ' ').toUpperCase()} ↗
        </a>
        {updatedAt && (
          <span suppressHydrationWarning style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cream)', letterSpacing: '0.5px' }}>
            Last updated: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
          </span>
        )}
      </div>
      {updatedAt && (
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cream)', letterSpacing: '0.5px' }}>
          Click to view the most current data on Polymarket
        </p>
      )}
    </div>
  )
}
