export const dynamic = 'force-dynamic'
// src/app/admin/markets/page.tsx
// Admin: resolve markets

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MarketStatus } from '@prisma/client'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { ResolveActions } from '@/components/admin/ResolveActions'

export const metadata = { title: 'Resolve Markets' }

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

export default async function AdminMarketsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

  const markets = await prisma.market.findMany({
    where: {
      source: 'USER_CREATED',
      status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] },
    },
    orderBy: { resolvesAt: 'asc' },
    include: {
      createdBy: {
        select: { id: true, username: true, displayName: true },
      },
      _count: { select: { predictions: true } },
    },
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
              Resolve Markets
            </h1>
            <p style={{ color: 'var(--mist)', marginTop: '4px' }}>
              {markets.length} market{markets.length !== 1 ? 's' : ''} awaiting resolution
            </p>
          </div>
        </div>

        {markets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--mist)', fontSize: '16px' }}>
              No markets to resolve. All caught up! 🎉
            </p>
            <Link href="/feed" className="btn btn-secondary" style={{ marginTop: '16px' }}>
              View Live Markets
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {markets.map((market) => (
              <div key={market.id} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className={`badge ${market.category === 'POLITICS' ? 'badge-category' : 'badge-paid'}`}>
                        {market.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)' }}>
                        {market.status === MarketStatus.OPEN ? 'OPEN' : 'CLOSED'}
                      </span>
                      <span className="badge badge-free" style={{ marginLeft: 'auto' }}>
                        {market._count.predictions} prediction{market._count.predictions !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '8px' }}>
                      {market.title}
                    </h3>
                    <p style={{ color: 'var(--mist)', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                      {market.description}
                    </p>
                    {market.resolutionCriteria && (
                      <div style={{ background: 'var(--ink3)', padding: '12px', borderRadius: '4px', fontSize: '13px' }}>
                        <strong style={{ color: 'var(--gold)' }}>Resolution Criteria:</strong>
                        <p style={{ color: 'var(--cream)', marginTop: '4px' }}>{market.resolutionCriteria}</p>
                      </div>
                    )}
                    {market.tags && market.tags.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {market.tags.map(tag => (
                          <span key={tag} style={{
                            padding: '3px 10px',
                            fontSize: '11px',
                            background: 'var(--fog)',
                            color: 'var(--cream)',
                            borderRadius: '12px',
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--mist)' }}>
                    {market.resolvesAt && (
                      <>
                        Resolves {format(new Date(market.resolvesAt), 'MMM d, h:mm a')}
                        {' · '}{formatDistanceToNow(new Date(market.resolvesAt), { addSuffix: true })}
                      </>
                    )}
                    {market.createdBy && (
                      <>
                        {' · '}Created by{' '}
                        <Link href={`/profile/${market.createdBy.username}`} style={{ color: 'var(--gold)' }}>
                          @{market.createdBy.username}
                        </Link>
                      </>
                    )}
                  </div>

                  <ResolveActions marketId={market.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
