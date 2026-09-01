// src/components/SearchBar.tsx
// Polymarket-style search bar with a live dropdown of matching markets.
// "See all results" / Enter jumps to the full results view (/feed?search=).
//
// variant="inline"  (default) — always-visible input (mobile menu, /feed page)
// variant="icon"             — collapsed search icon in the desktop nav; hovering
//                              reveals the input BELOW the nav bar so all menu
//                              links stay visible at laptop widths.

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  category: string
  marketProbability: number | null
  closesAt: string | null
  source: string
}

export default function SearchBar({ variant = 'inline' }: { variant?: 'inline' | 'icon' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [iconHovered, setIconHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // icon mode: panel is open only while the pointer is over icon/panel area (or grace timer pending).
  // Outside click clears iconHovered via the click-away handler, which closes it —
  // typed text alone does NOT keep the panel open.
  const isIconOpen = variant === 'icon' && iconHovered

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/markets?search=${encodeURIComponent(query.trim())}&limit=8`)
        const data = await res.json()
        setResults(data.markets || [])
        setOpen(true)
        setActiveIndex(-1)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Close on outside click (inline mode + icon mode click-away)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setIconHovered(false)
        if (leaveTimerRef.current) {
          clearTimeout(leaveTimerRef.current)
          leaveTimerRef.current = null
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
    }
  }, [])

  const goToAllResults = () => {
    router.push(`/feed?search=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
    setIconHovered(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        goToAllResults()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setIconHovered(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = activeIndex >= 0 ? results[activeIndex] : null
      if (selected) {
        router.push(`/market/${selected.id}`)
        setOpen(false)
        setQuery('')
        setIconHovered(false)
      } else {
        goToAllResults()
      }
    }
  }

  const resultsPanel = (alignRight: boolean) => {
    if (!(open && results.length > 0)) return null
    return (
      <div
        style={{
          position: 'absolute', top: 'calc(100% + 4px)',
          ...(alignRight ? { right: 0 } : { left: 0 }),
          width: 'min(420px, 90vw)',
          background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: '2px',
          boxShadow: 'var(--shadow-md)', zIndex: 1000, maxHeight: 400, overflowY: 'auto',
        }}
      >
        {results.map((r, i) => (
          <Link
            key={r.id}
            href={`/market/${r.id}`}
            onClick={() => { setOpen(false); setQuery(''); setIconHovered(false) }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              padding: '10px 12px',
              borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
              background: activeIndex === i ? 'rgba(201,168,76,0.08)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '13px', color: 'var(--cream)', lineHeight: '1.35',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {r.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--mist)',
                  letterSpacing: '1px', marginTop: 2, textTransform: 'uppercase',
                }}
              >
                {r.category} · {r.source.replace('_', ' ')}
              </div>
            </div>
            {r.marketProbability !== null && (
              <span
                style={{
                  fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--gold)',
                  fontWeight: 600, flexShrink: 0,
                }}
              >
                {Math.round(r.marketProbability * 100)}%
              </span>
            )}
          </Link>
        ))}

        <button
          onClick={goToAllResults}
          style={{
            display: 'block', width: '100%', textAlign: 'center', padding: '9px',
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px',
            color: 'var(--gold)', borderTop: '1px solid var(--border)',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          SEE ALL RESULTS →
        </button>
      </div>
    )
  }

  /* ── ICON variant: collapsed icon in the nav; hover reveals input in a panel below.
     Panel stays open while the pointer is anywhere over icon OR panel (hover bridge),
     and closes only on outside click or Escape — never on a quick mouse exit. ── */
  if (variant === 'icon') {
    return (
      <div
        ref={containerRef}
        className="nav-search-wrap nav-search-icon"
        style={{ position: 'relative' }}
        onMouseEnter={() => {
          if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current)
            leaveTimerRef.current = null
          }
          setIconHovered(true)
        }}
        onMouseLeave={() => {
          // Grace period so crossing the icon→panel gap doesn't close the panel.
          // After the grace, panel closes no matter what — outside click or leaving
          // both dismiss; user re-hovers or clicks the icon to reopen.
          if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
          leaveTimerRef.current = setTimeout(() => {
            setIconHovered(false)
          }, 400)
        }}
      >
        <button
          type="button"
          aria-label="Search markets"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: '50%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--mist)', transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--mist)')}
          onClick={() => { setIconHovered(true); setOpen(o => o) }}
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {isIconOpen && (
          <div
            style={{
              position: 'absolute', top: '100%', right: 0,
              marginTop: 0, paddingTop: 10,
              width: 'min(420px, 86vw)',
              background: 'transparent',
            }}
          >
          <div
            style={{
              padding: '12px',
              background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: '4px',
              boxShadow: 'var(--shadow-md)', zIndex: 1000,
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg
                aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none"
                style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--mist)', pointerEvents: 'none',
                }}
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search markets…"
                aria-label="Search markets"
                className="nav-search"
              />
              {loading && (
                <svg
                  aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none"
                  className="spin"
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--mist)', pointerEvents: 'none',
                  }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            {resultsPanel(true)}
          </div>
        </div>
        )}
      </div>
    )
  }

  /* ── INLINE variant: original always-visible input ── */
  return (
    <div ref={containerRef} className="nav-search-wrap" style={{ position: 'relative', width: 196, maxWidth: '22vw' }}>
      <div style={{ position: 'relative' }}>
        <svg
          aria-hidden
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--mist)', pointerEvents: 'none',
          }}
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search markets…"
          aria-label="Search markets"
          className="nav-search"
        />
        {loading && (
          <svg
            aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none"
            className="spin"
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--mist)', pointerEvents: 'none',
            }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {resultsPanel(false)}
    </div>
  )
}
