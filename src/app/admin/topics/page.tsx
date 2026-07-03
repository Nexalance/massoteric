export const dynamic = 'force-dynamic'
// src/app/admin/topics/page.tsx
// Admin topic review queue

import { auth } from '@/lib/auth-mock'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TopicStatus } from '@prisma/client'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Topic Review Queue' }

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) redirect('/feed')
}

export default async function AdminTopicsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')
  await requireAdmin(clerkId)

  const topics = await prisma.market.findMany({
    where: { source: 'USER_CREATED', topicStatus: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, username: true, displayName: true, email: true },
      },
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
              Topic Review Queue
            </h1>
            <p style={{ color: 'var(--mist)', marginTop: '4px' }}>
              {topics.length} topic{topics.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--mist)', fontSize: '16px' }}>
              No pending topics to review. 🎉
            </p>
            <Link href="/feed" className="btn btn-secondary" style={{ marginTop: '16px' }}>
              View Live Markets
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topics.map((topic) => (
              <div key={topic.id} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className={`badge ${topic.category === 'POLITICS' ? 'badge-category' : 'badge-paid'}`}>
                        {topic.category}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--mist)' }}>
                        Submitted {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '8px' }}>
                      {topic.title}
                    </h3>
                    <p style={{ color: 'var(--mist)', fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                      {topic.description}
                    </p>
                    <div style={{ background: 'var(--ink3)', padding: '12px', borderRadius: '4px', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--gold)' }}>Resolution Criteria:</strong>
                      <p style={{ color: 'var(--cream)', marginTop: '4px' }}>{topic.resolutionCriteria}</p>
                    </div>
                    {topic.tags && topic.tags.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {topic.tags.map(tag => (
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
                    Submitted by{' '}
                    <Link href={`/profile/${topic.createdBy.username}`} style={{ color: 'var(--gold)' }}>
                      {topic.createdBy.displayName} (@{topic.createdBy.username})
                    </Link>
                    {' · '}{topic.createdBy.email}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/admin/topics', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ topicId: topic.id, status: 'REJECTED' }),
                        })
                        if (res.ok) window.location.reload()
                      }}
                      className="btn btn-secondary"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/admin/topics', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ topicId: topic.id, status: 'APPROVED' }),
                        })
                        if (res.ok) window.location.reload()
                      }}
                      className="btn btn-primary"
                    >
                      Approve → Live
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
