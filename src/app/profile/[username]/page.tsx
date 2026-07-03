export const dynamic = 'force-dynamic'
// src/app/profile/[username]/page.tsx

import { auth } from '@/lib/auth-mock'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserAccuracySummary } from '@/lib/scoring'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ProfilePageProps { params: { username: string } }

export async function generateMetadata({ params }: ProfilePageProps) {
  const user = await prisma.user.findUnique({ where: { username: params.username } })
  return { title: user ? `${user.displayName} — Profile` : 'Profile' }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const [profileUser, viewer] = await Promise.all([
    prisma.user.findUnique({
      where: { username: params.username },
      include: {
        _count: { select: { predictions: true, subscribers: true, subscriptions: true } },
      },
    }),
    prisma.user.findUnique({ where: { clerkId } }),
  ])

  if (!profileUser || profileUser.isSuspended) notFound()

  const isOwnProfile = viewer?.id === profileUser.id

  const [accuracySummary, recentPredictions] = await Promise.all([
    getUserAccuracySummary(profileUser.id),
    prisma.prediction.findMany({
      where: { userId: profileUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        market: { select: { id: true, title: true, category: true, status: true, resolvedValue: true } },
      },
    }),
  ])

  return (
    <main>
      <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '64px' }}>

        {/* Profile header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'var(--ink3)', border: '2px solid var(--gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--gold)', fontWeight: 300,
            }}>
              {profileUser.displayName.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>
                    {profileUser.displayName}
                  </h1>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)', letterSpacing: '1px' }}>
                    @{profileUser.username}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isOwnProfile ? (
                    <Link href="/settings/profile" className="btn btn-secondary">Edit Profile</Link>
                  ) : (
                    <button className="btn btn-primary">Subscribe $9/mo</button>
                  )}
                </div>
              </div>

              {profileUser.bio && (
                <p style={{ fontSize: '15px', color: 'var(--mist)', margin: '12px 0', lineHeight: '1.7' }}>
                  {profileUser.bio}
                </p>
              )}

              {/* Certifications / tags */}
              {profileUser.certifications.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {profileUser.certifications.map(cert => (
                    <span key={cert} className="badge badge-category">{cert}</span>
                  ))}
                </div>
              )}

              {/* Stat pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
                {[
                  { label: 'Overall Accuracy', value: accuracySummary.overall ? `${accuracySummary.overall.accuracyPct}%` : '—', color: 'var(--signal)' },
                  { label: 'Predictions Made', value: profileUser._count.predictions.toString(), color: 'var(--cream)' },
                  { label: 'Subscribers', value: profileUser._count.subscribers.toString(), color: 'var(--gold)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', background: 'var(--ink3)', padding: '14px', borderRadius: '2px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color }}>{value}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

          {/* Predictions */}
          <div>
            <div className="section-label">Recent Predictions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPredictions.map(pred => {
                const resolved = pred.market.status === 'RESOLVED'
                const correct = resolved && pred.isCorrect

                return (
                  <Link key={pred.id} href={`/market/${pred.market.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="badge badge-category" style={{ marginBottom: '6px', display: 'inline-block' }}>
                          {pred.market.category}
                        </span>
                        <div style={{ fontSize: '14px', color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pred.market.title}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', marginTop: '4px' }}>
                          {formatDistanceToNow(pred.createdAt, { addSuffix: true })}
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, color: 'var(--gold)', flexShrink: 0 }}>
                        {Math.round(pred.probability * 100)}%
                      </div>
                      {resolved ? (
                        <span className={`badge ${correct ? 'badge-free' : ''}`} style={{
                          flexShrink: 0,
                          background: correct ? 'rgba(79,195,161,0.12)' : 'rgba(224,92,92,0.12)',
                          color: correct ? 'var(--signal)' : 'var(--danger)',
                        }}>
                          {correct ? 'Correct ✓' : 'Incorrect ✗'}
                        </span>
                      ) : (
                        <span className="badge badge-category" style={{ flexShrink: 0 }}>Pending</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Background sidebar */}
          <aside>
            <div className="section-label">Background</div>
            <div className="card">
              {[
                { label: 'Occupation', value: profileUser.occupation },
                { label: 'Employer', value: profileUser.employer },
                { label: 'Education', value: [profileUser.educationLevel, profileUser.educationField].filter(Boolean).join(', ') || null },
                { label: 'Institution', value: profileUser.institution },
                { label: 'Experience', value: profileUser.yearsExperience ? `${profileUser.yearsExperience} years` : null },
              ].filter(row => row.value).map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--mist)', letterSpacing: '1px', marginBottom: '4px' }}>
                    {label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{value}</div>
                </div>
              ))}
              {profileUser.websiteUrl && (
                <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gold)', letterSpacing: '1px' }}>
                  WEBSITE ↗
                </a>
              )}
            </div>

            {/* Accuracy by category */}
            {accuracySummary.byCategory.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: '20px' }}>Accuracy by Topic</div>
                <div className="card">
                  {accuracySummary.byCategory.map(score => (
                    <div key={score.category} style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--cream)' }}>{score.category}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 300, color: (score.accuracyPct || 0) > 75 ? 'var(--signal)' : 'var(--gold)' }}>
                          {score.accuracyPct}%
                        </span>
                      </div>
                      <div className="accuracy-bar">
                        <div className="accuracy-bar-fill" style={{ width: `${score.accuracyPct}%` }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--fog)', marginTop: '3px' }}>
                        {score.scoredPredictions} scored predictions
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
