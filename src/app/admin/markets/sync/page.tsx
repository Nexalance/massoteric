// src/app/admin/markets/sync/page.tsx
// Admin: Trigger Polymarket data sync

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SyncClient from './SyncClient'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

export default async function AdminSyncPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

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
              Sync Polymarket Data
            </h1>
            <p style={{ color: 'var(--mist)', marginTop: '4px' }}>
              Manually trigger market synchronization from Polymarket API
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
          <SyncClient />
        </div>

        <div style={{ marginTop: '24px' }}>
          <div className="section-label">What This Does</div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Fetches latest markets from Polymarket API',
              'Updates existing markets with current odds',
              'Auto-closes markets past their resolution date',
              'Checks for resolved markets and triggers scoring',
              'Updates competition leaderboards',
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
