export const dynamic = 'force-dynamic'
// src/app/admin/users/page.tsx

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SubscriptionTier } from '@prisma/client'

export const metadata = { title: 'Admin — Users' }

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: 'var(--fog)',
  STANDARD: 'var(--gold)',
  PRO: 'var(--signal)',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { tier?: SubscriptionTier; page?: string }
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

  const tier = searchParams.tier
  const page = parseInt(searchParams.page || '1')
  const limit = 25
  const skip = (page - 1) * limit

  const where = tier ? { subscriptionTier: tier } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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
        createdAt: true,
        _count: {
          select: {
            predictions: true,
            topicsCreated: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label">Admin</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
              Users
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--mist)', marginTop: '8px' }}>
              {total.toLocaleString()} total {tier ? tier : 'all'} users
            </p>
          </div>
          <Link href="/admin" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Tier Filter */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href="/admin/users"
            className={!tier ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            All ({total.toLocaleString()})
          </Link>
          <Link
            href="/admin/users?tier=FREE"
            className={tier === 'FREE' ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Free
          </Link>
          <Link
            href="/admin/users?tier=STANDARD"
            className={tier === 'STANDARD' ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Standard
          </Link>
          <Link
            href="/admin/users?tier=PRO"
            className={tier === 'PRO' ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Pro
          </Link>
        </div>

        {/* Users Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: 'var(--mist)', fontWeight: 600, fontSize: '11px', letterSpacing: '1px' }}>USER</th>
                <th style={{ padding: '12px 16px', color: 'var(--mist)', fontWeight: 600, fontSize: '11px', letterSpacing: '1px' }}>TIER</th>
                <th style={{ padding: '12px 16px', color: 'var(--mist)', fontWeight: 600, fontSize: '11px', letterSpacing: '1px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', color: 'var(--mist)', fontWeight: 600, fontSize: '11px', letterSpacing: '1px' }}>ACTIVITY</th>
                <th style={{ padding: '12px 16px', color: 'var(--mist)', fontWeight: 600, fontSize: '11px', letterSpacing: '1px' }}>JOINED</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                    hover: { background: 'var(--ink2)' },
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'var(--fog)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>
                          {user.displayName}
                          {user.isAdmin && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', background: 'var(--gold)', color: 'var(--ink)', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--mist)', fontFamily: 'var(--font-mono)' }}>
                          @{user.username} · {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      className="badge"
                      style={{
                        background: TIER_COLORS[user.subscriptionTier],
                        color: user.subscriptionTier === 'FREE' ? 'var(--ink)' : 'white',
                      }}
                    >
                      {user.subscriptionTier}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {user.isSuspended ? (
                      <span className="badge" style={{ background: 'var(--error)', color: 'white' }}>
                        SUSPENDED
                      </span>
                    ) : user.subscriptionStatus === 'ACTIVE' ? (
                      <span className="badge badge-category" style={{ background: 'var(--signal)', color: 'white' }}>
                        ACTIVE
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--fog)', color: 'var(--ink)' }}>
                        {user.subscriptionStatus}
                      </span>
                    )}
                    {!user.onboardingComplete && (
                      <div style={{ fontSize: '10px', color: 'var(--warning)', marginTop: '4px' }}>
                        Onboarding incomplete
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--cream)' }}>
                      {user._count.predictions} predictions
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)' }}>
                      {user._count.topicsCreated} markets created
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--mist)', fontSize: '12px' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--mist)' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {page > 1 && (
              <Link
                href={`/admin/users?tier=${tier || ''}&page=${page - 1}`}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                ← Previous
              </Link>
            )}
            <span style={{ padding: '8px 16px', color: 'var(--cream)', fontSize: '13px' }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/admin/users?tier=${tier || ''}&page=${page + 1}`}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
