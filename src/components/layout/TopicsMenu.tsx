// src/components/layout/TopicsMenu.tsx
// Polymarket-style "Topics" dropdown in the top nav.
// Two groups: sort tabs (Trending / New / Breaking) + all categories.
// Clicking either navigates to /feed with the right query param.

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CATEGORIES, SORTS } from '@/lib/categories'

export default function TopicsMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Detect active category / sort so we can highlight it
  const activeCategory = searchParams.get('category') || 'ALL'
  const activeSort = searchParams.get('sort') || 'trending'

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function buildHref(params: Record<string, string>) {
    const sp = new URLSearchParams(params)
    return `/feed?${sp.toString()}`
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1.5px',
          textTransform: 'uppercase', color: open ? 'var(--cream)' : 'var(--mist)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'color 0.15s', padding: 0,
        }}
      >
        Topics
        <span style={{ fontSize: '8px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0,
            minWidth: 320, background: 'var(--ink2)', border: '1px solid var(--border)',
            borderRadius: '2px', boxShadow: 'var(--shadow-md)', zIndex: 1000,
            padding: '14px',
          }}
        >
          {/* Sort tabs */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1.5px', color: 'var(--fog)', marginBottom: '8px' }}>
            SORT
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {SORTS.map(s => {
              const isActive = activeSort === s.value
              return (
                <Link
                  key={s.value}
                  href={buildHref({ sort: s.value })}
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1, textAlign: 'center',
                    padding: '7px 10px', borderRadius: '2px',
                    fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--ink)' : 'var(--mist)',
                    background: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)', textDecoration: 'none',
                  }}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>

          {/* Categories */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1.5px', color: 'var(--fog)', marginBottom: '8px' }}>
            CATEGORIES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value
              return (
                <Link
                  key={cat.value}
                  href={cat.value === 'ALL' ? '/feed' : buildHref({ category: cat.value })}
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '8px 10px', borderRadius: '2px',
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: isActive ? 'var(--gold)' : 'var(--cream)',
                    background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                    border: '1px solid transparent', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {isActive && <span style={{ color: 'var(--gold)' }}>•</span>}
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
