// src/app/market/[id]/page.tsx
// Individual market page — shows predictions, discussion, post form

import { auth } from '@/lib/auth-mock'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { canAccess } from '@/lib/access'
import { isPredictionLocked } from '@/lib/scoring'
import { FeatureKey } from '@prisma/client'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'

interface MarketPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: MarketPageProps) {
  const market = await prisma.market.findUnique({ where: { id: params.id } })
  return { title: market?.title || 'Market' }
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const [market, viewer] = await Promise.all([
    prisma.market.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { predictions: true, comments: true } },
      },
    }),
    prisma.user.findUnique({ where: { clerkId } }),
  ])

  if (!market) notFound()
  if (!viewer) redirect('/onboarding')

  // Increment view count
  await prisma.market.update({ where: { id: market.id }, data: { viewCount: { increment: 1 } } })

  const canSeeFullReasoning = await canAccess(viewer.subscriptionTier, FeatureKey.FULL_REASONING)
  const canFilterAccuracy = await canAccess(viewer.subscriptionTier, FeatureKey.ACCURACY_FILTER)
  const isLocked = isPredictionLocked(market.closesAt)

  // Get predictions for this market
  const predictions = await prisma.prediction.findMany({
    where: { marketId: market.id },
    orderBy: canFilterAccuracy
      ? [{ user: { accuracyScores: { _count: 'desc' } } }]
      : [{ createdAt: 'desc' }],
    take: 20,
    include: {
      user: {
        select: {
          id: true, username: true, displayName: true, avatarUrl: true,
          occupation: true,
          accuracyScores: {
            where: { category: null },
            select: { accuracyPct: true, scoredPredictions: true },
          },
        },
      },
      edits: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { previousProbability: true, editReason: true, createdAt: true },
      },
    },
  })

  // Check if viewer already has a prediction
  const myPrediction = predictions.find(p => p.user.id === viewer.id)

  // Avg user probability
  const avgProbability = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length
    : null

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/feed" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', letterSpacing: '1px' }}>
            ← FEED
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--fog)', margin: '0 8px' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', letterSpacing: '1px' }}>{market.category}</span>
        </div>

        {/* Market header */}
        <div className="card" style={{ borderLeft: '3px solid var(--gold)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge badge-category">{market.category}</span>
            <span className="badge" style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--mist)' }}>
              {market.source.replace('_', ' ')}
            </span>
            {market.status === 'RESOLVED' && <span className="badge badge-free">Resolved</span>}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 600, color: 'var(--cream)', marginBottom: '20px', lineHeight: '1.3' }}>
            {market.title}
          </h1>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                label: 'Market Probability',
                value: market.marketProbability !== null ? `${Math.round(market.marketProbability * 100)}%` : 'N/A',
                color: market.marketProbability && market.marketProbability > 0.5 ? 'var(--signal)' : 'var(--gold)',
              },
              {
                label: 'Total Predictions',
                value: market._count.predictions.toString(),
                color: 'var(--cream)',
              },
              {
                label: 'Avg User Estimate',
                value: avgProbability !== null ? `${Math.round(avgProbability * 100)}%` : '—',
                color: 'var(--gold2)',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', background: 'var(--ink3)', padding: '16px', borderRadius: '2px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color }}>{value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {market.closesAt && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', marginTop: '16px' }}>
              {isLocked ? '🔒 Predictions locked — ' : '📅 Closes '}
              {format(market.closesAt, 'MMMM d, yyyy')} ({formatDistanceToNow(market.closesAt, { addSuffix: true })})
            </p>
          )}

          {market.description && (
            <p style={{ fontSize: '15px', color: 'var(--mist)', marginTop: '16px', lineHeight: '1.7', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {market.description}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>

          {/* Predictions list */}
          <div>
            <div className="section-label" style={{ marginBottom: '16px' }}>
              {market._count.predictions} Predictions
              {!canFilterAccuracy && (
                <Link href="/settings/billing" style={{ marginLeft: '12px', color: 'var(--mist)', fontSize: '9px' }}>
                  UPGRADE TO SORT BY ACCURACY →
                </Link>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {predictions.map((prediction) => {
                const overallScore = prediction.user.accuracyScores[0]
                const isMyPrediction = prediction.user.id === viewer.id
                const showFullReasoning = canSeeFullReasoning || isMyPrediction

                return (
                  <div key={prediction.id} className="card" style={{
                    borderLeft: isMyPrediction ? '3px solid var(--gold)' : '3px solid transparent',
                  }}>
                    {/* User header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <Link href={`/profile/${prediction.user.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--ink3)', border: '1px solid var(--fog)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--gold)',
                        }}>
                          {prediction.user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>
                            {prediction.user.displayName}
                            {isMyPrediction && <span style={{ marginLeft: '8px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--gold)' }}>YOU</span>}
                          </div>
                          {prediction.user.occupation && (
                            <div style={{ fontSize: '12px', color: 'var(--mist)' }}>{prediction.user.occupation}</div>
                          )}
                        </div>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {overallScore && (
                          <span className="badge badge-free" style={{ fontSize: '10px' }}>
                            {overallScore.accuracyPct}% accurate
                          </span>
                        )}
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: prediction.probability > 0.5 ? 'var(--signal)' : 'var(--gold)' }}>
                          {Math.round(prediction.probability * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div>
                      {showFullReasoning ? (
                        <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.7', fontStyle: 'italic' }}>
                          "{prediction.reasoning}"
                        </p>
                      ) : (
                        <div>
                          <p style={{ fontSize: '14px', color: 'var(--mist)', lineHeight: '1.7', fontStyle: 'italic' }}>
                            "{prediction.reasoningSnippet}"
                          </p>
                          <div style={{
                            marginTop: '10px', padding: '10px 14px',
                            background: 'rgba(201,168,76,0.05)',
                            border: '1px solid rgba(201,168,76,0.15)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--gold)', letterSpacing: '1px' }}>
                              🔒 CONTINUE READING — FULL ANALYSIS
                            </span>
                            <Link href="/settings/billing" className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '10px' }}>
                              Unlock →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Edit history */}
                    {prediction.edits.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--fog)', letterSpacing: '1px' }}>
                          EDITED {prediction.edits.length}×
                        </span>
                        {prediction.edits.slice(0, 1).map((edit, i) => (
                          <div key={i} style={{ fontSize: '11px', color: 'var(--fog)', marginTop: '4px' }}>
                            Was {Math.round(edit.previousProbability * 100)}% — {formatDistanceToNow(edit.createdAt, { addSuffix: true })}
                            {edit.editReason && ` · "${edit.editReason}"`}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)' }}>
                      {formatDistanceToNow(prediction.createdAt, { addSuffix: true })}
                      {prediction.status === 'LOCKED' && ' · 🔒 locked'}
                      {prediction.status === 'SCORED' && prediction.brierScore !== null && (
                        <span style={{ marginLeft: '8px', color: 'var(--signal)' }}>
                          Brier: {prediction.brierScore.toFixed(3)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Post prediction sidebar */}
          <aside style={{ position: 'sticky', top: '80px' }}>
            <div className="card" style={{ borderTop: '2px solid var(--gold)' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>
                {myPrediction ? 'Update Your Prediction' : 'Post Your Prediction'}
              </div>

              {isLocked ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔒</div>
                  <p style={{ fontSize: '14px', color: 'var(--mist)' }}>
                    Predictions are locked within 48 hours of market close.
                  </p>
                  {myPrediction && (
                    <p style={{ fontSize: '13px', color: 'var(--gold)', marginTop: '12px', fontStyle: 'italic' }}>
                      Your prediction: {Math.round(myPrediction.probability * 100)}%
                    </p>
                  )}
                </div>
              ) : (
                <form action={`/api/predictions`} method="POST">
                  <input type="hidden" name="marketId" value={market.id} />

                  <label className="label">Your Probability Estimate</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <input
                      type="range" name="probability_range" min={1} max={99}
                      defaultValue={myPrediction ? Math.round(myPrediction.probability * 100) : 50}
                      style={{ flex: 1, accentColor: 'var(--gold)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color: 'var(--signal)', width: '56px', textAlign: 'right' }}>
                      {myPrediction ? `${Math.round(myPrediction.probability * 100)}%` : '50%'}
                    </span>
                  </div>

                  <label className="label">Your Reasoning</label>
                  <textarea
                    name="reasoning"
                    className="input"
                    placeholder="Explain your reasoning (minimum 50 characters). This builds your reputation and track record."
                    defaultValue={myPrediction?.reasoning || ''}
                    style={{ marginBottom: '12px', minHeight: '140px' }}
                  />

                  {myPrediction && (
                    <>
                      <label className="label">Reason for Update (optional)</label>
                      <input type="text" name="editReason" className="input" placeholder="Why are you revising?" style={{ marginBottom: '12px' }} />
                    </>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {myPrediction ? 'Update Prediction' : 'Submit Prediction'}
                  </button>

                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', marginTop: '10px', lineHeight: '1.5' }}>
                    All edits are timestamped and public. Predictions lock 48 hours before market close.
                  </p>
                </form>
              )}
            </div>

            {market.externalUrl && (
              <a
                href={market.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', marginTop: '12px', textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--mist)', letterSpacing: '1px',
                }}
              >
                VIEW ON {market.source} ↗
              </a>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
