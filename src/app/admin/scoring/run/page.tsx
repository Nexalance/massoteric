// src/app/admin/scoring/run/page.tsx
// Admin: Manually trigger scoring engine

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ScoringClient from './ScoringClient'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

export default async function AdminScoringPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

  // Get stats for resolved markets that could be scored
  const resolvedMarkets = await prisma.market.count({
    where: { status: 'RESOLVED' }
  })

  const marketsNeedingScoring = await prisma.market.count({
    where: {
      status: 'RESOLVED',
      predictions: {
        some: {
          // Has predictions but might not be scored yet
        }
      }
    }
  })

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
              Run Scoring Engine
            </h1>
            <p style={{ color: 'var(--mist)', marginTop: '4px' }}>
              Manually trigger Brier score calculation for resolved markets
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginBottom: '24px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--cream)' }}>
              {resolvedMarkets}
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)', marginTop: '4px' }}>
              Resolved Markets
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--gold)' }}>
              {marketsNeedingScoring}
            </div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)', marginTop: '4px' }}>
              Markets with Predictions
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
          <ScoringClient />
        </div>

        <div style={{ marginTop: '24px' }}>
          <div className="section-label">What This Does</div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Calculates Brier scores for all predictions on resolved markets',
              'Updates user accuracy scores and leaderboards',
              'Updates per-category accuracy rankings',
              'Updates competition scores and standings',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--signal)' }}>✓</span>
                <span style={{ color: 'var(--mist)', fontSize: '14px' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
