// src/app/competitions/page.tsx
// Fantasy League competitions listing

export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompetitionsListClient from './CompetitionsListClient'

export const metadata = { title: 'Fantasy Leagues' }

export default async function CompetitionsPage() {
  const { userId: clerkId, user } = await auth()
  if (!clerkId) redirect('/sign-in')

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="section-label">Fantasy League</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 300, color: 'var(--cream)' }}>
              Competitions
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--mist)', marginTop: '8px', maxWidth: '500px' }}>
              Join prediction competitions and compete to have the best Brier score. Compete over time periods
              and climb the leaderboards.
            </p>
          </div>
          <Link href="/competitions/create" className="btn btn-primary">
            Create Competition
          </Link>
        </div>

        {/* How it works */}
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cream)', marginBottom: '12px' }}>
            How Fantasy Leagues Work
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <style>{`
              @media (max-width: 600px) {
                div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
            {[
              {
                step: '1',
                title: 'Join or Create',
                description: 'Join a public competition or create your own with custom rules and time periods.',
              },
              {
                step: '2',
                title: 'Make Predictions',
                description: 'Predict on markets that resolve within the competition period. Only your best predictions count.',
              },
              {
                step: '3',
                title: 'Win Prizes',
                description: 'Competitors with the lowest Brier score (highest accuracy) at the end win prizes.',
              },
            ].map(({ step, title, description }) => (
              <div key={step}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {step}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>
                  {title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--mist)', lineHeight: '1.4' }}>
                  {description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitions list */}
        <CompetitionsListClient userId={user?.id} />
      </div>
    </main>
  )
}
