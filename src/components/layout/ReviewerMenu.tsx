'use client'
// src/components/layout/ReviewerMenu.tsx
// Account menu for reviewer (magic-link) sessions. These sessions have no
// Clerk identity, so Clerk's UserButton cannot render — this provides the
// equivalent: an avatar that opens My Profile / Admin / Exit reviewer mode.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export function ReviewerMenu({ displayName, tier }: { displayName: string; tier?: string | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Your account"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--ink)',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px',
          border: 'none', cursor: 'pointer',
        }}
      >
        R
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '44px', right: 0, zIndex: 1000,
          width: '230px', background: 'var(--ink2)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>
              {displayName}
              {tier && tier !== 'FREE' && (
                <span style={{ marginLeft: '6px', color: 'var(--gold)', fontSize: '11px' }}>· {tier}</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mist)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Reviewer session
            </div>
          </div>

          <Link href="/me" onClick={() => setOpen(false)} style={{ display: 'block', padding: '8px 10px', fontSize: '13px', color: 'var(--cream)', textDecoration: 'none', borderRadius: '4px' }}>
            My Profile
          </Link>
          <Link href="/admin" onClick={() => setOpen(false)} style={{ display: 'block', padding: '8px 10px', fontSize: '13px', color: 'var(--cream)', textDecoration: 'none', borderRadius: '4px' }}>
            Admin Dashboard
          </Link>
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <a href="/dev-access/logout" style={{ display: 'block', padding: '8px 10px', fontSize: '13px', color: 'var(--danger)', textDecoration: 'none', borderRadius: '4px' }}>
            Exit reviewer mode
          </a>
        </div>
      )}
    </div>
  )
}
