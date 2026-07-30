// src/app/admin/payouts/page.tsx
// Admin Payout Review - approve or reject creator payout requests

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminPayoutsClient from './AdminPayoutsClient'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

export default async function AdminPayoutsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  try {
    await requireAdmin(clerkId)
  } catch {
    redirect('/?error=admin_required')
  }

  // Fetch all payouts, ordered by most recent first
  const payouts = await prisma.payout.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          stripeAccountId: true,
        },
      },
    },
    orderBy: { requestedAt: 'desc' },
  })

  // Group by status
  const pending = payouts.filter(p => p.status === 'PENDING')
  const processing = payouts.filter(p => p.status === 'PROCESSING')
  const completed = payouts.filter(p => p.status === 'COMPLETED')
  const failed = payouts.filter(p => p.status === 'FAILED')

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ color: 'var(--mist)', fontSize: '14px' }}>
            ← Back to Dashboard
          </Link>
          <div>
            <div className="section-label">Admin</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: 'var(--cream)' }}>
              Payout Management
            </h1>
            <p style={{ color: 'var(--mist)', marginTop: '4px' }}>
              Review and process creator payout requests
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4px',
          marginBottom: '32px',
        }}>
          {[
            { label: 'Pending', count: pending.length, color: 'var(--warning)' },
            { label: 'Processing', count: processing.length, color: 'var(--gold)' },
            { label: 'Completed', count: completed.length, color: 'var(--signal)' },
            { label: 'Failed', count: failed.length, color: 'var(--error)' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: stat.color }}>
                {stat.count}
              </div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <AdminPayoutsClient payouts={payouts} />
      </div>
    </main>
  )
}
