export const dynamic = 'force-dynamic'
// src/app/leaderboard/page.tsx

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { canAccess } from '@/lib/access'
import { FeatureKey, MarketCategory } from '@prisma/client'
import Link from 'next/link'

export const metadata = { title: 'Leaderboard' }

const PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: '90d', label: '90 Days' },
  { value: '30d', label: '30 Days' },
]

const CATEGORIES = [
  { value: '', label: 'All Topics' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'TECH', label: 'Tech' },
  { value: 'MACRO', label: 'Macro' },
]

interface LeaderboardPageProps {
  searchParams: { category?: string; period?: string; page?: string }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const viewer = await prisma.user.findUnique({ where: { clerkId } })
  if (!viewer) redirect('/onboarding')

  const canFilterCategory = await canAccess(viewer.subscriptionTier, FeatureKey.CATEGORY_LEADERBOARD)
  const category = (searchParams.category as MarketCategory) || undefined
  const page = parseInt(searchParams.page || '1')
  const limit = 25
  const skip = (page - 1) * limit

  // Block category filter for free users
  const effectiveCategory = canFilterCategory ? category : undefined

  const [scores, total] = await Promise.all([
    prisma.accuracyScore.findMany({
      where: {
        category: effectiveCategory ?? null,
        scoredPredictions: { gte: 3 },
      },
      orderBy: { avgBrierScore: 'asc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            avatarUrl: true, occupation: true, subscriptionTier: true,
            _count: { select: { predictions: true, subscribers: true } },
          },
        },
      },
    }),
    prisma.accuracyScore.count({
      where: { category: effectiveCategory ?? null, scoredPredictions: { gte: 3 } },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="section-label">Rankings</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, color: 'var(--cream)' }}>
            The Leaderboard
          </h1>
          <p style={{ color: 'var(--mist)', marginTop: '8px' }}>Ranked by Brier Score accuracy. Minimum 3 scored predictions to qualify.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {PERIODS.map(p => (
              <Link key={p.value} href={`/leaderboard?period=${p.value}${category ? `&category=${category}` : ''}`}
                style={{
                  padding: '7px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  color: (searchParams.period || 'all') === p.value ? 'var(--ink)' : 'var(--mist)',
                  background: (searchParams.period || 'all') === p.value ? 'var(--gold)' : 'transparent',
                  border: '1px solid var(--fog)', borderRadius: '2px',
                }}>
                {p.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const isActive = (category || '') === cat.value
              const isLocked = cat.value && !canFilterCategory
              return (
                <Link key={cat.value}
                  href={canFilterCategory ? `/leaderboard?category=${cat.value}` : '/settings/billing'}
                  style={{
                    padding: '7px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                    letterSpacing: '1px', textTransform: 'uppercase',
                    color: isLocked ? 'var(--fog)' : isActive ? 'var(--ink)' : 'var(--mist)',
                    background: isActive ? 'var(--gold)' : 'transparent',
                    border: `1px solid ${isLocked ? 'var(--fog)' : 'var(--fog)'}`,
                    borderRadius: '2px', opacity: isLocked ? 0.5 : 1,
                  }}>
                  {isLocked ? '🔒 ' : ''}{cat.label}
                </Link>
              )
            })}
          </div>
        </div>

        {!canFilterCategory && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)' }}>
              🔒 Upgrade to filter leaderboard by category
            </span>
            <Link href="/settings/billing" className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '10px' }}>Upgrade →</Link>
          </div>
        )}

        {/* Top 3 podium */}
        {page === 1 && scores.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '24px' }}>
            {[scores[1], scores[0], scores[2]].map((score, visualIdx) => {
              const rank = visualIdx === 1 ? 1 : visualIdx === 0 ? 2 : 3
              const medals = ['🥈', '🥇', '🥉']
              const heights = ['140px', '160px', '120px']
              return (
                <Link key={score.userId} href={`/profile/${score.user.username}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    textAlign: 'center', padding: '24px 16px',
                    borderTop: `3px solid ${rank === 1 ? 'var(--gold)' : rank === 2 ? 'var(--mist)' : '#CD7F32'}`,
                    minHeight: heights[visualIdx],
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{medals[visualIdx]}</div>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'var(--ink3)',
                      border: '2px solid var(--fog)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '14px',
                      color: 'var(--gold)', margin: '0 auto 10px',
                    }}>
                      {score.user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--cream)', marginBottom: '4px' }}>{score.user.displayName}</div>
                    {score.user.occupation && <div style={{ fontSize: '11px', color: 'var(--mist)', marginBottom: '8px' }}>{score.user.occupation}</div>}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: 'var(--signal)' }}>{score.accuracyPct}%</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>{score.scoredPredictions} scored</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {scores.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '20px', color: 'var(--cream)', marginBottom: '8px' }}>No Rankings Yet</h3>
            <p style={{ color: 'var(--mist)', fontSize: '14px', marginBottom: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              The leaderboard is waiting for markets to resolve and predictions to be scored. Users need at least 3 scored predictions to appear.
            </p>
            <Link href="/feed" className="btn btn-primary">Browse Markets</Link>
          </div>
        )}

        {/* Full table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Forecaster', 'Category', 'Accuracy', 'Predictions', 'Subscribers'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((score, idx) => {
                const rank = skip + idx + 1
                return (
                  <tr key={score.userId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--ink3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: rank <= 3 ? 'var(--gold)' : 'var(--fog)', fontWeight: rank <= 3 ? '500' : '400' }}>
                      #{rank}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link href={`/profile/${score.user.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink3)', border: '1px solid var(--fog)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', flexShrink: 0 }}>
                          {score.user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{score.user.displayName}</div>
                          {score.user.occupation && <div style={{ fontSize: '11px', color: 'var(--mist)' }}>{score.user.occupation}</div>}
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-category">{score.category || 'Overall'}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, color: (score.accuracyPct || 0) > 80 ? 'var(--signal)' : 'var(--gold)' }}>
                        {score.accuracyPct}%
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--mist)' }}>
                      {score.scoredPredictions} / {score.totalPredictions}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--mist)' }}>
                      {score.user._count.subscribers}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
            {page > 1 && <Link href={`/leaderboard?page=${page - 1}`} className="btn btn-secondary">← Previous</Link>}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', alignSelf: 'center' }}>{page} / {totalPages}</span>
            {page < totalPages && <Link href={`/leaderboard?page=${page + 1}`} className="btn btn-secondary">Next →</Link>}
          </div>
        )}
      </div>
    </main>
  )
}
