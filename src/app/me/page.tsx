export const dynamic = 'force-dynamic'
// src/app/me/page.tsx
// Shows current user information including username

import { auth } from '@/lib/auth-mock'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import UserMenu from '@/components/UserMenu'

export default async function MePage() {
  const { userId: clerkId, user: clerkUser } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      username: true,
      displayName: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      isAdmin: true,
      isSuspended: true,
      onboardingComplete: true,
      _count: { select: { predictions: true } },
    },
  })

  if (!user) redirect('/onboarding')

  // Use Clerk data as fallback if database values are missing
  const displayDisplayName = user.displayName || clerkUser?.fullName || clerkUser?.firstName || 'User'
  const displayEmail = user.email || clerkUser?.emailAddresses?.[0]?.emailAddress || clerkUser?.email || 'No email'

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', background: '#0D0F14' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>
            My Profile Info
          </h1>
          <p style={{ color: '#8A909E', fontSize: '14px' }}>
            Your account information and username
          </p>
        </div>

        {/* Info Card */}
        <div style={{ background: '#151820', borderRadius: '8px', border: '1px solid #3A4055', overflow: 'hidden' }}>
          {/* Username Highlight */}
          <div style={{ background: 'rgba(201, 168, 76, 0.1)', padding: '20px', borderBottom: '1px solid #3A4055' }}>
            <div style={{ fontSize: '11px', color: '#C9A84C', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              YOUR USERNAME
            </div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#F5F0E8' }}>
              @{user.username}
            </div>
            <div style={{ fontSize: '12px', color: '#8A909E', marginTop: '8px' }}>
              Profile URL: <span style={{ fontFamily: 'monospace', color: '#C9A84C' }}>{`/profile/${user.username}`}</span>
            </div>
          </div>

          {/* Other Info */}
          <div style={{ padding: '20px' }}>
            {[
              { label: 'Display Name', value: displayDisplayName },
              { label: 'Email', value: displayEmail },
              { label: 'Internal ID', value: user.id, monospace: true },
              { label: 'Clerk ID', value: user.clerkId, monospace: true },
              { label: 'Subscription Tier', value: user.subscriptionTier, highlight: true },
              { label: 'Subscription Status', value: user.subscriptionStatus },
              { label: 'Predictions Made', value: user._count.predictions.toString() },
              { label: 'Admin', value: user.isAdmin ? 'Yes' : 'No' },
              { label: 'Suspended', value: user.isSuspended ? 'Yes' : 'No' },
              { label: 'Onboarding Complete', value: user.onboardingComplete ? 'Yes' : 'No' },
            ].map((field) => (
              <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #3A4055' }}>
                <div style={{ fontSize: '12px', color: '#8A909E', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {field.label}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: field.highlight ? '#C9A84C' : '#F5F0E8',
                    fontFamily: field.monospace ? 'monospace' : 'inherit',
                    fontWeight: field.highlight ? 600 : 'normal',
                  }}
                >
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Link
            href={`/profile/${user.username}`}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: '#151820',
              border: '1px solid #3A4055',
              borderRadius: '6px',
              color: '#F5F0E8',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            View My Profile
          </Link>
          <Link
            href="/settings/billing"
            style={{
              flex: 1,
              padding: '14px 24px',
              background: '#C9A84C',
              border: 'none',
              borderRadius: '6px',
              color: '#0D0F14',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Manage Subscription
          </Link>
        </div>

        {/* Logout / Account Menu */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', color: '#8A909E' }}>
            Need to sign out?{' '}
            <UserMenu />
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(138, 144, 158, 0.1)', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8A909E', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            QUICK LINKS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/feed" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '13px' }}>
              → Browse Markets
            </Link>
            <Link href="/leaderboard" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '13px' }}>
              → View Leaderboard
            </Link>
            <Link href="/market/new" style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '13px' }}>
              → Submit Prediction
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
