// src/components/layout/Nav.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useCurrentUser } from '@/lib/useCurrentUser'
import UserButtonWrapper from '@/components/UserButtonWrapper'
import SearchBar from '@/components/SearchBar'
import TopicsMenu from '@/components/layout/TopicsMenu'
import Link from 'next/link'
import { Suspense } from 'react'
import { CATEGORIES } from '@/lib/categories'

export default function Nav({ dataMassotericNav }: { dataMassotericNav?: string }) {
  const { isLoaded, userId, isSignedIn, user: clerkUser } = useAuth()
  const { currentUser, loading: userLoading } = useCurrentUser()

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on outside click (both mouse and touch)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [mobileMenuOpen])

  // Close mobile menu on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Don't render nav while loading to avoid flash
  if (!isLoaded || userLoading) {
    return null
  }

  // Combine Clerk user and database user info
  const displayName = currentUser?.displayName || clerkUser?.fullName || clerkUser?.firstName || 'User'
  const subscriptionTier = currentUser?.subscriptionTier || clerkUser?.publicMetadata?.subscriptionTier
  const username = currentUser?.username

  return (
    <nav {...(dataMassotericNav && { 'data-massoteric-nav': dataMassotericNav })} style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
      background: 'rgba(13,15,20,0.97)',
      borderBottom: '1px solid var(--border)',
      backdropFilter: 'blur(8px)',
      height: 60,
      display: 'flex', alignItems: 'center',
      padding: '0 var(--page-pad)',
    }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* LEFT zone — logo + browse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href={isSignedIn ? '/feed' : '/'} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--cream)' }}>
              Mass<span style={{ color: 'var(--gold)' }}>oteric</span>
            </div>
          </Link>

          {/* Topics dropdown — desktop only (use hamburger on mobile) */}
          <Suspense fallback={null}>
            <TopicsMenu className="hide-mobile" />
          </Suspense>

          {/* Hamburger menu button — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-expanded={mobileMenuOpen}
            aria-label="Open menu"
            className="hide-desktop"
            style={{
              display: 'flex', flexDirection: 'column', gap: '5px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{
              width: '22px', height: '2px', background: 'var(--cream)',
              transition: mobileMenuOpen ? 'transform 0.2s' : 'none',
              transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none',
            }} />
            <span style={{
              width: '22px', height: '2px', background: 'var(--cream)',
              transition: mobileMenuOpen ? 'opacity 0.2s' : 'none',
              opacity: mobileMenuOpen ? 0 : 1,
            }} />
            <span style={{
              width: '22px', height: '2px', background: 'var(--cream)',
              transition: mobileMenuOpen ? 'transform 0.2s' : 'none',
              transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none',
            }} />
          </button>

          {/* Quick links — desktop only */}
          {isSignedIn && userId ? (
            <>
              <span className="nav-divider hide-mobile" />
              <div className="hide-mobile" style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
                <Link href="/feed" className="nav-link">Feed</Link>
                <Link href="/competitions" className="nav-link">Competitions</Link>
                <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                <Link href="/about" className="nav-link">About</Link>
                <Link href="/" className="nav-link" style={{ color: 'var(--gold)' }}>Home</Link>
                {/* Only show Predict link for PRO/STANDARD users */}
                {(currentUser?.subscriptionTier === 'PRO' || currentUser?.subscriptionTier === 'STANDARD') && (
                  <Link href="/market/new" className="nav-link">Predict</Link>
                )}
                {/* Creator Dashboard - show to all signed-in users */}
                <Link href="/creator/dashboard" className="nav-link">Creator</Link>
                {currentUser?.isAdmin && (
                  <Link href="/admin" className="nav-link nav-link-admin">Admin</Link>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Non-signed-in quick links */}
              <span className="nav-divider hide-mobile" />
              <div className="hide-mobile" style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
                <Link href="/feed" className="nav-link">Browse Markets</Link>
                <Link href="/about" className="nav-link">About</Link>
                <Link href="/" className="nav-link" style={{ color: 'var(--gold)' }}>Home</Link>
              </div>
            </>
          )}
        </div>

        {/* CENTER zone — search — desktop only */}
        <div className="hide-mobile">
          <SearchBar />
        </div>

        {/* RIGHT zone — account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isSignedIn && userId ? (
            <>
              <Link href={`/me`} className="nav-link hide-mobile" style={{ letterSpacing: '1px' }}>My Profile</Link>
              {username ? (
                <Link href={`/profile/${username}`} className="nav-link hide-mobile" style={{ letterSpacing: '1px' }}>
                  {displayName}
                  {subscriptionTier && subscriptionTier !== 'FREE' && (
                    <span style={{ marginLeft: '6px', color: 'var(--gold)' }}>· {subscriptionTier}</span>
                  )}
                </Link>
              ) : (
                <span className="nav-link hide-mobile" style={{ letterSpacing: '1px' }}>
                  {displayName}
                  {subscriptionTier && subscriptionTier !== 'FREE' && (
                    <span style={{ marginLeft: '6px', color: 'var(--gold)' }}>· {subscriptionTier}</span>
                  )}
                </span>
              )}
              <UserButtonWrapper afterSignOutUrl="/" />
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/sign-in" className="btn btn-ghost" style={{ fontSize: '11px' }}>Sign In</Link>
              <Link href="/sign-up" className="btn btn-primary" style={{ fontSize: '11px' }}>Join Free</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <>
          {/* Overlay backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 899,
            }}
          />

          {/* Mobile menu panel */}
          <div
            ref={mobileMenuRef}
            style={{
              position: 'fixed', top: 60, left: 0, right: 0,
              background: 'var(--ink2)', borderBottom: '1px solid var(--border)',
              zIndex: 900, padding: '16px var(--page-pad)',
              maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
            }}
          >
            {/* Close button at top */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cream)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                ×
              </button>
            </div>

            {/* Mobile search at top */}
            <div style={{ marginBottom: '20px' }}>
              <SearchBar />
            </div>

            {/* Topics/Categories section - mobile only */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '1.5px',
                color: 'var(--mist)', marginBottom: '8px', textTransform: 'uppercase',
              }}>
                Topics
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {CATEGORIES.map(cat => {
                  const href = cat.value === 'ALL'
                    ? '/feed/all'
                    : `/feed/${cat.value.toLowerCase()}`
                  return (
                    <Link
                      key={cat.value}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                        textDecoration: 'none', borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {cat.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {isSignedIn && userId ? (
              <>
                {/* User info header */}
                <div style={{
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>
                    {displayName}
                    {subscriptionTier && subscriptionTier !== 'FREE' && (
                      <span style={{ marginLeft: '8px', color: 'var(--gold)', fontSize: '11px' }}>
                        · {subscriptionTier}
                      </span>
                    )}
                  </div>
                  {username && (
                    <Link
                      href={`/profile/${username}`}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ fontSize: '12px', color: 'var(--mist)', textDecoration: 'none' }}
                    >
                      @{username}
                    </Link>
                  )}
                </div>

                {/* Nav links stacked */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Link
                    href="/feed"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Feed
                  </Link>
                  <Link
                    href="/competitions"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Competitions
                  </Link>
                  <Link
                    href="/leaderboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    About
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--gold)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Home
                  </Link>
                  {(currentUser?.subscriptionTier === 'PRO' || currentUser?.subscriptionTier === 'STANDARD') && (
                    <Link
                      href="/market/new"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                        textDecoration: 'none', borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Predict
                    </Link>
                  )}
                  <Link
                    href="/creator/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Creator Dashboard
                  </Link>
                  {currentUser?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        padding: '12px 16px', fontSize: '15px', color: 'var(--signal)',
                        textDecoration: 'none', borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href={`/me`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    My Profile
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Non-signed-in mobile menu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--gold)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Home
                  </Link>
                  <Link
                    href="/feed"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Browse Markets
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: '12px 16px', fontSize: '15px', color: 'var(--cream)',
                      textDecoration: 'none', borderBottom: '1px solid var(--border)',
                    }}
                  >
                    About
                  </Link>
                  <div style={{ padding: '16px' }}>
                    <Link
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '8px' }}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Join Free
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  )
}
