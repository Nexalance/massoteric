// src/app/creator/dashboard/page.tsx
// Creator Dashboard - earnings, subscribers, payout management
// PHASE 2 PREVIEW — hidden for Milestone 1 per the completion brief.
// The full dashboard implementation returns here in Milestone 2 (see git history).

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Creator Dashboard' }

export default async function CreatorDashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '80px', paddingBottom: '64px', textAlign: 'center' }}>
        <div className="section-label">Coming Soon</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)', margin: '12px 0 16px' }}>
          Creator Dashboard
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--mist)', maxWidth: '480px', margin: '0 auto', lineHeight: '1.7' }}>
          Creator tools for earning from your predictions are on the way. Keep building your track record in the meantime.
        </p>
        <a href="/feed/all" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>
          Back to Feed
        </a>
      </div>
    </main>
  )
}
