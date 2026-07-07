export const dynamic = 'force-dynamic'
// src/app/feed/page.tsx
// Main authenticated feed — shows markets with predictions

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarketCategory } from '@prisma/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Feed' }

// Category display config
const CATEGORIES = [
  { value: 'ALL', label: 'All Topics' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'POLITICS', label: 'Politics' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'TECH', label: 'Tech' },
  { value: 'MACRO', label: 'Macro' },
  { value: 'OTHER', label: 'Other' },
]

interface FeedPageProps {
  searchParams: { category?: string; page?: string }
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { userId: clerkId } = await auth()
  // Allow public access — no redirect
  const isAuthenticated = !!clerkId

  // Fetch user to check subscription tier
  let userTier: 'FREE' | 'STANDARD' | 'PRO' = 'FREE'
  let canCreateTopic = false
  if (clerkId) {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { subscriptionTier: true }
    })
    if (user) {
      userTier = user.subscriptionTier
      canCreateTopic = userTier === 'PRO' || userTier === 'STANDARD'
    }
  }

  const category = searchParams.category as MarketCategory | undefined
  const page = parseInt(searchParams.page || '1')
  const limit = 20

  // Fetch markets
  const where = {
    status: 'OPEN' as const,
    ...(category && { category }),
    OR: [
      { source: { not: 'USER_CREATED' as const } },
      { source: 'USER_CREATED' as const, topicStatus: 'APPROVED' as const },
    ],
  }

  const [markets, total, topUsers] = await Promise.all([
    prisma.market.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
      include: { _count: { select: { predictions: true, comments: true } } },
    }),
    prisma.market.count({ where }),
    // Top predictors sidebar
    prisma.accuracyScore.findMany({
      where: { category: null, scoredPredictions: { gte: 1 } },
      orderBy: { avgBrierScore: 'asc' },
      take: 5,
      include: {
        user: { select: { username: true, displayName: true, occupation: true } },
      },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <main>
      {/* Category filter */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 var(--page-pad)' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', display: 'flex', gap: '4px', overflowX: 'auto', padding: '12px 0' }}>
          {CATEGORIES.map(cat => {
            const isActive = (!category && cat.value === 'ALL') || category === cat.value
            return (
              <Link
                key={cat.value}
                href={cat.value === 'ALL' ? '/feed' : `/feed?category=${cat.value}`}
                style={{
                  padding: '7px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--ink)' : 'var(--mist)',
                  background: isActive ? 'var(--gold)' : 'transparent',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </Link>
            )
          })}
          {canCreateTopic && (
          <Link
            href="/market/new"
            style={{
              marginLeft: 'auto',
              padding: '7px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              border: '1px solid var(--gold)',
              borderRadius: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            + New Topic
          </Link>
          )}
        </div>
      </div>

      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

          {/* Market list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', letterSpacing: '1px' }}>
                {total} OPEN MARKETS
                {!isAuthenticated && (
                  <span style={{ marginLeft: '12px', color: 'var(--gold)' }}>
                    · Sign up to predict
                  </span>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {markets.map(market => (
                <Link key={market.id} href={`/market/${market.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    borderLeft: market.featured ? '3px solid var(--gold)' : '3px solid transparent',
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-category">{market.category}</span>
                        <span className="badge" style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--mist)' }}>
                          {market.source.replace('_', ' ')}
                        </span>
                        {market.featured && <span className="badge badge-paid">Featured</span>}
                      </div>
                      {market.closesAt && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                          closes {formatDistanceToNow(market.closesAt, { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--cream)', marginBottom: '12px', lineHeight: '1.4' }}>
                      {market.title}
                    </h3>

                    {market.marketProbability !== null && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', letterSpacing: '1px' }}>MARKET PROBABILITY</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: market.marketProbability > 0.5 ? 'var(--signal)' : 'var(--gold)', fontWeight: 600 }}>
                            {Math.round(market.marketProbability * 100)}%
                          </span>
                        </div>
                        <div className="accuracy-bar">
                          <div className="accuracy-bar-fill" style={{ width: `${market.marketProbability * 100}%` }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)' }}>
                        {market._count.predictions} predictions · {market._count.comments} comments
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '1px' }}>
                        PREDICT →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
                {page > 1 && (
                  <Link href={`/feed?page=${page - 1}${category ? `&category=${category}` : ''}`} className="btn btn-secondary">
                    ← Previous
                  </Link>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', alignSelf: 'center' }}>
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={`/feed?page=${page + 1}${category ? `&category=${category}` : ''}`} className="btn btn-secondary">
                    Next →
                  </Link>
                )}
              </div>
            )}

            {/* Public CTA section */}
            {!isAuthenticated && (
              <div className="card" style={{
                marginTop: '24px',
                padding: '20px',
                textAlign: 'center',
                borderColor: 'rgba(201,168,76,0.2)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
                  Ready to make predictions?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--mist)', marginBottom: '16px' }}>
                  Join Massoteric to track your accuracy and compete with experts
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Link href="/sign-in" className="btn btn-ghost">Sign In</Link>
                  <Link href="/sign-up" className="btn btn-primary">Create Free Account</Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: '80px' }}>
            <div className="section-label">Top Predictors</div>
            <div className="card">
              {topUsers.map((score, i) => (
                <Link key={score.userId} href={`/profile/${score.user.username}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 0',
                    borderBottom: i < topUsers.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--fog)', width: '20px' }}>
                      #{i + 1}
                    </span>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--ink3)', border: '1px solid var(--fog)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)',
                      flexShrink: 0,
                    }}>
                      {score.user.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {score.user.displayName}
                      </div>
                      {score.user.occupation && (
                        <div style={{ fontSize: '11px', color: 'var(--mist)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {score.user.occupation}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--signal)', fontWeight: 300 }}>
                        {score.accuracyPct}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/leaderboard" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '2px', color: 'var(--gold)' }}>
                FULL LEADERBOARD →
              </Link>
            </div>

            {/* Upgrade card — tier aware */}
            {!isAuthenticated ? (
              <div className="card" style={{ marginTop: '16px', borderColor: 'rgba(201,168,76,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
                  See Full Analysis
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '16px', lineHeight: '1.6' }}>
                  Join to view complete reasoning from top forecasters. Filter by accuracy. Follow the experts.
                </p>
                <Link href="/sign-up" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Join Free — Sign Up
                </Link>
              </div>
            ) : userTier === 'FREE' ? (
              <div className="card" style={{ marginTop: '16px', borderColor: 'rgba(201,168,76,0.2)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>
                  Unlock full analysis
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '16px', lineHeight: '1.6' }}>
                  See complete reasoning from every forecaster. Filter by accuracy. Follow the experts who've been right.
                </p>
                <Link href="/settings/billing" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Upgrade — from $9/mo
                </Link>
              </div>
            ) : (
              // STANDARD or PRO subscriber - show they already have access
              <div className="card" style={{ marginTop: '16px', borderColor: 'rgba(79,195,161,0.2)', background: 'rgba(79,195,161,0.05)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '10px', color: 'var(--signal)' }}>
                  ✓ Full Access Unlocked
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mist)', marginBottom: '16px', lineHeight: '1.6' }}>
                  You're on the <strong style={{ color: 'var(--gold)' }}>{userTier}</strong> plan. You have full access to reasoning, accuracy filters, and expert leaderboards.
                </p>
                <Link href="/settings/billing" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  Manage Subscription
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
