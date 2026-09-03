'use client'
// src/app/market/[id]/PolymarketLinkClient.tsx
// Location-aware "View on Polymarket" link.
// US visitors (by device timezone) get polymarket.us — Polymarket's CFTC-regulated
// US exchange — everyone else gets polymarket.com.
//
// The two sites have DIFFERENT URL schemes:
//   .com → /event/{numeric id}     .us → /event/{slug}  (a different, smaller market set)
// So for US users we link using the slug captured at sync time. If no slug is known,
// fall back to a .us search for the market title — always resolves, never 404s.

import { useEffect, useState } from 'react'

// Timezones that are America/* but NOT the United States
const NON_US_AMERICA = new Set([
  'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Caracas', 'America/La_Paz',
  'America/Lima', 'America/Mexico_City', 'America/Montserrat', 'America/Tijuana',
  'America/Sao_Paulo', 'America/Fortaleza', 'America/Recife', 'America/Bahia',
  'America/Asuncion', 'America/Montevideo', 'America/Grand_Turk', 'America/Cayenne',
  'America/Paramaribo', 'America/Guatemala', 'America/Havana', 'America/Kingston',
  'America/Panama', 'America/Costa_Rica', 'America/El_Salvador', 'America/Tegucigalpa',
  'America/Managua', 'America/Port-au-Prince', 'America/Puerto_Rico', 'America/Jamaica',
  'America/Aruba', 'America/Curacao', 'America/Guayaquil', 'America/Santo_Domingo',
])

// US states + territories use these timezone names
const US_ZONES = new Set([
  'America/New_York', 'America/Detroit', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
  'America/Indiana/Indianapolis', 'America/Indiana/Vincennes', 'America/Indiana/Winamac',
  'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Vevay',
  'America/Chicago', 'America/Indiana/Tell_City', 'America/Indiana/Knox', 'America/Menominee',
  'America/North_Dakota/Center', 'America/North_Dakota/New_Salem', 'America/North_Dakota/Beulah',
  'America/Denver', 'America/Boise', 'America/Phoenix', 'America/Los_Angeles',
  'America/Anchorage', 'America/Juneau', 'America/Sitka', 'America/Metlakatla', 'America/Yakutat',
  'America/Nome', 'America/Adak', 'Pacific/Honolulu',
])

function detectUS(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (US_ZONES.has(tz)) return true
    if (NON_US_AMERICA.has(tz)) return false
    return tz.startsWith('America/') // unmapped America/* zone — best effort US
  } catch {
    return false
  }
}

interface Props {
  externalUrl: string
  source: string
  marketSlug?: string | null
  marketTitle: string
}

export default function PolymarketLinkClient({ externalUrl, source, marketSlug, marketTitle }: Props) {
  const [isUS, setIsUS] = useState<boolean | null>(null)

  useEffect(() => {
    setIsUS(detectUS())
  }, [])

  const isPolymarket = source === 'POLYMARKET'

  let href = externalUrl
  if (isPolymarket) {
    // Both polymarket domains support /event/{slug} URLs — prefer the readable slug
    // when sync captured one; fall back to the legacy ID-based URL.
    if (marketSlug) {
      href = `https://polymarket.${isUS ? 'us' : 'com'}/event/${marketSlug}`
    } else if (isUS) {
      // No slug known → .us search always resolves (never 404s)
      href = `https://polymarket.us/search?q=${encodeURIComponent(marketTitle)}`
    }
  }

  return (
    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
      {isPolymarket && isUS !== null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cream)', letterSpacing: '0.5px' }}>
          {isUS
            ? <>Linked to <strong style={{ color: 'var(--gold)' }}>polymarket.us</strong> — the US-regulated exchange (different market set from polymarket.com).</>
            : <>Linked to <strong style={{ color: 'var(--gold)' }}>polymarket.com</strong>. Not available to visitors located in the US.</>}
        </span>
      )}
    </div>
  )
}
