// src/app/competitions/create/page.tsx
// Create a new Fantasy League competition

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateCompetitionClient from './CreateCompetitionClient'

export const metadata = { title: 'Create Competition' }

export default async function CreateCompetitionPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/competitions" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>
            ← Back to Competitions
          </Link>
          <div className="section-label" style={{ marginTop: '12px' }}>Fantasy League</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
            Create Competition
          </h1>
        </div>

        <div style={{ maxWidth: '600px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <CreateCompetitionClient />
          </div>

          {/* Info box */}
          <div className="card" style={{ padding: '16px', marginTop: '16px', backgroundColor: 'var(--fog)' }}>
            <p style={{ fontSize: '12px', color: 'var(--mist)', lineHeight: '1.5' }}>
              <strong>Tip:</strong> Set a competition period of 1-3 months for the best experience. Markets that
              resolve within your competition period will count toward the leaderboard. Shorter periods mean
              more frequent competitions and faster results.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
