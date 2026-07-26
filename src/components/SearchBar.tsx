// src/components/SearchBar.tsx
// Polymarket-style search bar with a live dropdown of matching markets.
// "See all results" / Enter jumps to the full results view (/feed?search=).

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

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

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
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToAllResults() {
    if (query.trim().length < 2) return
    router.push(`/feed?search=${encodeURIComponent(query.trim())}`)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }

    if (e.key === 'ArrowDown' && open && results.length > 0) {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % results.length)
      return
    }

    if (e.key === 'ArrowUp' && open && results.length > 0) {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? results.length - 1 : i - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const selected = activeIndex >= 0 ? results[activeIndex] : null
      if (selected) {
        router.push(`/market/${selected.id}`)
        setOpen(false)
        setQuery('')
      } else {
        goToAllResults()
      }
    }
  }

  const hasResults = open && results.length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 196, maxWidth: '22vw' }}>
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
            aria-hidden
            width="13" height="13" viewBox="0 0 24 24" fill="none"
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

      {hasResults && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: '2px',
            boxShadow: 'var(--shadow-md)', zIndex: 1000, maxHeight: 400, overflowY: 'auto',
          }}
        >
          {results.map((r, i) => (
            <Link
              key={r.id}
              href={`/market/${r.id}`}
              onClick={() => { setOpen(false); setQuery('') }}
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
      )}
    </div>
  )
}
