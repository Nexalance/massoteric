// src/components/layout/Nav.tsx

'use client'

import { useAuth } from '@/lib/useAuth'
import { useCurrentUser } from '@/lib/useCurrentUser'
import UserButtonWrapper from '@/components/UserButtonWrapper'
import SearchBar from '@/components/SearchBar'
import TopicsMenu from '@/components/layout/TopicsMenu'
import Link from 'next/link'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function Nav() {
  const { isLoaded, userId, isSignedIn, user: clerkUser } = useAuth()
  const { currentUser, loading: userLoading } = useCurrentUser()

  // Don't render nav while loading to avoid flash
  if (!isLoaded || userLoading) {
    return null
  }

  // Combine Clerk user and database user info
  const displayName = currentUser?.displayName || clerkUser?.fullName || clerkUser?.firstName || 'User'
  const subscriptionTier = currentUser?.subscriptionTier || clerkUser?.publicMetadata?.subscriptionTier
  const username = currentUser?.username

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
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* LEFT zone — logo + browse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href={isSignedIn ? '/feed' : '/'} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--cream)' }}>
              Mass<span style={{ color: 'var(--gold)' }}>oteric</span>
            </div>
          </Link>

          {/* Topics dropdown — always visible (browse is public) */}
          <Suspense fallback={null}>
            <TopicsMenu />
          </Suspense>

          {/* Quick links */}
          {isSignedIn && userId && (
            <>
              <span className="nav-divider" />
              <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
                <Link href="/feed" className="nav-link">Feed</Link>
                <Link href="/leaderboard" className="nav-link">Leaderboard</Link>
                {/* Only show Predict link for PRO/STANDARD users */}
                {(currentUser?.subscriptionTier === 'PRO' || currentUser?.subscriptionTier === 'STANDARD') && (
                  <Link href="/market/new" className="nav-link">Predict</Link>
                )}
                {currentUser?.isAdmin && (
                  <Link href="/admin" className="nav-link nav-link-admin">Admin</Link>
                )}
              </div>
            </>
          )}
        </div>

        {/* CENTER zone — search (own space, away from the links) */}
        <SearchBar />

        {/* RIGHT zone — account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isSignedIn && userId ? (
            <>
              <Link href={`/me`} className="nav-link" style={{ letterSpacing: '1px' }}>My Profile</Link>
              {username ? (
                <Link href={`/profile/${username}`} className="nav-link" style={{ letterSpacing: '1px' }}>
                  {displayName}
                  {subscriptionTier && subscriptionTier !== 'FREE' && (
                    <span style={{ marginLeft: '6px', color: 'var(--gold)' }}>· {subscriptionTier}</span>
                  )}
                </Link>
              ) : (
                <span className="nav-link" style={{ letterSpacing: '1px' }}>
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
    </nav>
  )
}
