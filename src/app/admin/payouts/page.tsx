// src/app/admin/payouts/page.tsx
// Admin Payout Review - approve or reject creator payout requests

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          Payout Management
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Review and process creator payout requests
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {[
          { label: 'Pending', count: pending.length, color: 'var(--warning)' },
          { label: 'Processing', count: processing.length, color: 'var(--info)' },
          { label: 'Completed', count: completed.length, color: 'var(--success)' },
          { label: 'Failed', count: failed.length, color: 'var(--error)' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '600', color: stat.color }}>
              {stat.count}
            </div>
          </div>
        ))}
      </div>

      <AdminPayoutsClient payouts={payouts} />
    </main>
  )
}
