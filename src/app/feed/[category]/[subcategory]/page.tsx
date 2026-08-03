export const dynamic = 'force-dynamic'
// src/app/feed/[category]/[subcategory]/page.tsx
// Subcategory-specific feed — handles /feed/{category}/{subcategory}

import { auth } from '@/lib/auth-mock'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarketCategory } from '@prisma/client'
import Link from 'next/link'
import PolymarketLink from '@/components/PolymarketLink'
import { formatDistanceToNow } from 'date-fns'
import { CATEGORIES, SORTS, SortValue } from '@/lib/categories'
import { ensureMigrated } from '@/lib/migrations'
import SubcategoryMenu from '@/components/feed/SubcategoryMenu'

interface SubcategoryPageProps {
  params: { category: string; subcategory: string }
  searchParams: { page?: string; sort?: string; search?: string }
}

function normalizeCategory(slug: string): MarketCategory | null {
  const upper = slug.toUpperCase()
  if (CATEGORIES.some(c => c.value === upper)) {
    return upper as MarketCategory
  }
  return null
}

export async function generateMetadata({ params }: SubcategoryPageProps) {
  const category = normalizeCategory(params.category)

  // Fetch subcategory from database using composite key
  const subcategory = category ? await prisma.subcategory.findUnique({
    where: { slug_category: { slug: params.subcategory, category } },
    select: { id: true, label: true, slug: true, category: true },
  }) : null

  if (!category || !subcategory || subcategory.category !== category) {
    return { title: 'Not Found' }
  }

  return { title: `${subcategory.label} - ${category} Markets` }
}

export default async function SubcategoryPage({ params, searchParams }: SubcategoryPageProps) {
  const { userId: clerkId } = await auth()
  const isAuthenticated = !!clerkId

  await ensureMigrated()

  // Normalize and validate category
  const category = normalizeCategory(params.category)
  if (!category) return notFound()

  // Fetch subcategory from DB to get its ID and validate it belongs to this category
  const subcategoryRecord = await prisma.subcategory.findUnique({
    where: { slug_category: { slug: params.subcategory, category } },
    select: { id: true, label: true, slug: true, category: true },
  })

  if (!subcategoryRecord || subcategoryRecord.category !== category) {
    return notFound()
  }

  // Fetch user data
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

  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const now = new Date()

  const sortParam = (searchParams.sort || 'trending') as SortValue
  const sort: SortValue = SORTS.some(s => s.value === sortParam) ? sortParam : 'trending'
  const search = searchParams.search?.trim() || undefined

  // Fetch all subcategories for this category from database (for the menu)
  const allSubcategories = await prisma.subcategory.findMany({
    where: { category },
    orderBy: [
      { order: 'asc' },
      { label: 'asc' }, // Fallback: alphabetical for dynamic tags (order=0)
    ],
    select: {
      slug: true,
      label: true,
      category: true,
    },
  })

  // Fetch market counts per subcategory - slug-keyed for SubcategoryMenu
  // Use Set-based deduplication to count unique events, not duplicate rows
  let subcategoryCounts: Record<string, number> = {}

  // Fetch all OPEN Polymarket markets for this category
  const allMarkets = await prisma.market.findMany({
    where: {
      category,
      source: 'POLYMARKET' as const,
      status: 'OPEN' as const,
      subcategoryId: { not: null },
    },
    select: { polymarketEventId: true, externalId: true, subcategoryId: true },
  })

  // Build slug -> Set of event IDs
  // Use polymarketEventId when available, fallback to parsing externalId
  const subcategoryToEvents = new Map<number, Set<string>>()
  for (const market of allMarkets) {
    if (!market.subcategoryId) continue
    // Use polymarketEventId if available, otherwise extract from externalId
    const baseEventId = market.polymarketEventId || market.externalId?.split('-')[0]
    if (!baseEventId) continue
    if (!subcategoryToEvents.has(market.subcategoryId)) {
      subcategoryToEvents.set(market.subcategoryId, new Set())
    }
    subcategoryToEvents.get(market.subcategoryId)!.add(baseEventId)
  }

  // Build slug -> count map
  const dbSubcategories = await prisma.subcategory.findMany({
    where: { category },
    select: { id: true, slug: true },
  })
  const idToSlug = Object.fromEntries(dbSubcategories.map(s => [s.id, s.slug]))
  for (const [subcategoryId, eventIds] of subcategoryToEvents) {
    const slug = idToSlug[subcategoryId]
    if (slug) subcategoryCounts[slug] = eventIds.size
  }

  // Fetch markets - filtered by subcategory
  const where = {
    status: 'OPEN' as const,
    category,
    subcategoryId: subcategoryRecord.id,
    AND: [
      { OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
      { OR: [{ resolvesAt: null }, { resolvesAt: { gte: now } }] },
      {
        OR: [
          { source: { not: 'USER_CREATED' as const } },
          { source: 'USER_CREATED' as const, topicStatus: 'APPROVED' as const },
        ],
      },
      ...(search
        ? [{
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { tags: { has: search } },
            ],
          }]
        : []),
    ],
  }

  const orderBy =
    sort === 'new'
      ? [{ createdAt: 'desc' as const }]
      : sort === 'breaking'
      ? [{ featured: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ featured: 'desc' as const }, { viewCount: 'desc' as const }, { createdAt: 'desc' as const }]

  // Count unique event IDs, not duplicate rows
  // Use polymarketEventId when available, fallback to parsing externalId
  const allSubcategoryMarkets = await prisma.market.findMany({
    where,
    select: { polymarketEventId: true, externalId: true },
  })
  const uniqueEvents = new Set(
    allSubcategoryMarkets.map(m => m.polymarketEventId || m.externalId?.split('-')[0]).filter(Boolean)
  )
  const total = uniqueEvents.size

  const [markets, topUsers] = await Promise.all([
    prisma.market.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      include: { _count: { select: { predictions: true, comments: true } } },
    }),
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

  // Build href that preserves sort/search
  function feedHref(opts: { sort?: string; search?: string; page?: number }) {
    const basePath = `/feed/${params.category}/${params.subcategory}`
    const sp = new URLSearchParams()
    if (opts.sort && opts.sort !== 'trending') sp.set('sort', opts.sort)
    if (opts.search) sp.set('search', opts.search)
    if (opts.page && opts.page > 1) sp.set('page', String(opts.page))
    const s = sp.toString()
    return s ? `${basePath}?${s}` : basePath
  }

  const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category

  return (
    <main>
      {/* Filter bar: sort tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 var(--page-pad)' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          {/* Scrollable sort tabs row */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', padding: '12px 0', alignItems: 'center' }}>
            {/* Back to Category */}
            <Link
              href={`/feed/${params.category}`}
              style={{
                padding: '7px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--mist)',
                border: '1px solid transparent',
                borderRadius: '2px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              ← {categoryLabel}
            </Link>

            {/* Divider */}
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 8px', flexShrink: 0 }} />

            {/* Sort tabs */}
            {SORTS.map(s => {
              const isActive = sort === s.value
              return (
                <Link
                  key={s.value}
                  href={feedHref({ sort: s.value, search })}
                  style={{
                    padding: '7px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--cream)' : 'var(--mist)',
                    background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                    border: isActive ? '1px solid var(--gold)' : '1px solid transparent',
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </Link>
              )
            })}
          </div>

          {/* "+ New Topic" button - separate row, always visible */}
          {canCreateTopic && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '12px' }}>
              <Link
                href="/market/new"
                style={{
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
            </div>
          )}
        </div>
      </div>

      {/* Subcategory menu - with active subcategory */}
      <SubcategoryMenu
        category={category}
        subcategories={allSubcategories}
        counts={subcategoryCounts}
        activeSubcategory={params.subcategory}
      />

      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
        <div className="feed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

          {/* Market list */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', letterSpacing: '1px' }}>
                {search ? (
                  <>
                    RESULTS FOR <span style={{ color: 'var(--cream)' }}>“{search}”</span> · {total}
                  </>
                ) : (
                  <>{subcategoryRecord.label} · {total} OPEN MARKETS</>
                )}
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
                    {/* Badges row - full width on mobile */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="badge badge-category">{market.category}</span>
                        {market.subcategory && (
                          <span className="badge" style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--cream)', border: '1px solid rgba(201,168,76,0.3)' }}>
                            {market.subcategory.label}
                          </span>
                        )}
                        <span className="badge" style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--mist)' }}>
                          {market.source.replace('_', ' ')}
                        </span>
                        {market.featured && <span className="badge badge-paid">Featured</span>}
                      </div>
                      {market.closesAt && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', whiteSpace: 'nowrap' }}>
                          closes {formatDistanceToNow(market.closesAt, { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {/* Title - larger on mobile */}
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--cream)', marginBottom: '14px', lineHeight: '1.4' }}>
                      {market.title}
                    </h3>

                    {/* Probability bar */}
                    {market.marketProbability !== null && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--fog)', letterSpacing: '1px' }}>MARKET PROBABILITY</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: market.marketProbability > 0.5 ? 'var(--signal)' : 'var(--gold)', fontWeight: 600 }}>
                            {Math.round(market.marketProbability * 100)}%
                          </span>
                        </div>
                        <div className="accuracy-bar">
                          <div className="accuracy-bar-fill" style={{ width: `${market.marketProbability * 100}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Bottom row - stats + actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--fog)' }}>
                        {market._count.predictions} predictions · {market._count.comments} comments
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                        {market.source === 'POLYMARKET' && market.externalUrl && (
                          <PolymarketLink url={market.externalUrl} />
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                          PREDICT →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Empty state */}
            {markets.length === 0 && (
              <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--cream)', marginBottom: '8px' }}>
                  {search ? 'No matching markets' : 'No open markets in this subcategory yet'}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mist)', lineHeight: 1.6 }}>
                  {search ? (
                    <>Try a different term, or browse <Link href={`/feed/${params.category}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>all {categoryLabel} markets</Link>.</>
                  ) : (
                    <>Try browsing <Link href={`/feed/${params.category}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>all {categoryLabel} markets</Link> or check back later — new markets are added regularly.</>
                  )}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
                {page > 1 && (
                  <Link href={feedHref({ sort, search, page: page - 1 })} className="btn btn-secondary">
                    ← Previous
                  </Link>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', alignSelf: 'center' }}>
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link href={feedHref({ sort, search, page: page + 1 })} className="btn btn-secondary">
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
          <aside style={{ position: 'sticky', top: '80px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
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

            {/* Upgrade card */}
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
