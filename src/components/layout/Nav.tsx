// src/components/layout/Nav.tsx

'use client'

import { useAuth } from '@/lib/useAuth'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function Nav() {
  const { user, isLoading } = useAuth()

  // Don't render nav while loading to avoid flash
  if (isLoading) {
    return null
  }

  const clerkId = user?.clerkId

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
      background: 'rgba(13,15,20,0.97)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(8px)',
      height: 60,
      display: 'flex', alignItems: 'center',
      padding: '0 var(--page-pad)',
    }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link href={clerkId ? '/feed' : '/'} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--cream)' }}>
            Mass<span style={{ color: 'var(--gold)' }}>oteric</span>
          </div>
        </Link>

        {/* Nav links */}
        {clerkId && (
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {[
              { href: '/feed', label: 'Feed' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/market/new', label: 'Predict' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--mist)', textDecoration: 'none', transition: 'color 0.15s' }}>
                {label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link href="/admin" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', textDecoration: 'none' }}>
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {clerkId && user ? (
            <>
              <Link href={`/me`} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', textDecoration: 'none', letterSpacing: '1px' }}>
                My Profile
              </Link>
              <Link href={`/profile/${user.username}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', textDecoration: 'none', letterSpacing: '1px' }}>
                {user.displayName}
                {user.subscriptionTier !== 'FREE' && (
                  <span style={{ marginLeft: '6px', color: 'var(--gold)' }}>· {user.subscriptionTier}</span>
                )}
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonTrigger: {
                      fontWeight: '500',
                      fontSize: '14px',
                      padding: '8px 16px',
                    },
                    userButtonPopoverCard: {
                      background: '#151820',
                      border: '1px solid #3A4055',
                    },
                    userButtonPopoverActionButton: {
                      color: '#F5F0E8',
                    },
                  },
                }}
              />
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/sign-in" className="btn btn-ghost" style={{ fontSize: '11px' }}>Sign In</Link>
              <Link href="/sign-up" className="btn btn-primary" style={{ fontSize: '11px' }}>Join Free</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
