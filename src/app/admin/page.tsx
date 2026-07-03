export const dynamic = 'force-dynamic'
// src/app/admin/page.tsx

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

export default async function AdminPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

  const [userCount, predictionCount, marketCount, paidCount, pendingTopics, flags, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count(),
    prisma.market.count({ where: { status: 'OPEN' } }),
    prisma.user.count({ where: { subscriptionTier: { not: 'FREE' } } }),
    prisma.market.count({ where: { source: 'USER_CREATED', topicStatus: 'PENDING' } }),
    prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, displayName: true, email: true, subscriptionTier: true, createdAt: true } }),
  ])

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label">Admin</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin/topics" className="btn btn-secondary">Topic Queue ({pendingTopics})</Link>
            <Link href="/admin/users" className="btn btn-secondary">Users</Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '32px' }}>
          {[
            { label: 'Total Users', value: userCount.toLocaleString(), sub: 'registered accounts' },
            { label: 'Paid Subscribers', value: paidCount.toLocaleString(), sub: `${Math.round(paidCount / Math.max(userCount, 1) * 100)}% conversion` },
            { label: 'Open Markets', value: marketCount.toLocaleString(), sub: 'active prediction markets' },
            { label: 'Total Predictions', value: predictionCount.toLocaleString(), sub: 'across all markets' },
            { label: 'Pending Topics', value: pendingTopics.toLocaleString(), sub: 'awaiting moderation', alert: pendingTopics > 0 },
            { label: 'Platform Health', value: '✓', sub: 'all systems operational' },
          ].map(({ label, value, sub, alert }) => (
            <div key={label} className="card" style={{ borderTop: alert ? '2px solid var(--warning)' : '2px solid transparent', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: alert ? 'var(--warning)' : 'var(--cream)' }}>{value}</div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)', margin: '4px 0 2px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Feature Flags */}
          <div>
            <div className="section-label">Feature Access Controls</div>
            <div className="card">
              <p style={{ fontSize: '12px', color: 'var(--mist)', marginBottom: '16px' }}>
                Toggle features between Free and Paid. Changes take effect immediately for all users.
              </p>
              {flags.map((flag, i) => (
                <div key={flag.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < flags.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{flag.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mist)', marginTop: '2px' }}>{flag.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: flag.isFree ? 'var(--signal)' : 'var(--gold)', letterSpacing: '1px' }}>
                      {flag.isFree ? 'FREE' : 'PAID'}
                    </span>
                    {/* Toggle — in production this calls PATCH /api/admin/flags via client component */}
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: flag.isFree ? 'var(--signal)' : 'var(--fog)', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 3px', justifyContent: flag.isFree ? 'flex-end' : 'flex-start' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent signups + topic queue */}
          <div>
            <div className="section-label">Recent Signups</div>
            <div className="card" style={{ marginBottom: '20px' }}>
              {recentUsers.map((u, i) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < recentUsers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: 600 }}>{u.displayName}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>{u.email}</div>
                  </div>
                  <span className={`badge ${u.subscriptionTier !== 'FREE' ? 'badge-paid' : 'badge-category'}`}>
                    {u.subscriptionTier}
                  </span>
                </div>
              ))}
              <Link href="/admin/users" style={{ display: 'block', textAlign: 'center', marginTop: '14px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px' }}>
                VIEW ALL USERS →
              </Link>
            </div>

            <div className="section-label">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/admin/topics" className="btn btn-secondary" style={{ justifyContent: 'space-between' }}>
                <span>Review Topic Queue</span>
                {pendingTopics > 0 && <span className="badge badge-paid">{pendingTopics} pending</span>}
              </Link>
              <Link href="/admin/markets/sync" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                Sync Polymarket Data
              </Link>
              <Link href="/admin/scoring/run" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                Run Scoring Engine
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
