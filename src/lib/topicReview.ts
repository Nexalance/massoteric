// src/lib/topicReview.ts
// Review-feedback store for user-submitted topics.
// Deliberately raw SQL (no Prisma model) so there is no schema drift: this
// project applies DB changes as idempotent SQL (see src/lib/migrations.ts),
// and the only readers are the admin review flow and the creator's
// "your topic was reviewed" notice on the topic form.
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

let tableReady = false

export async function ensureTopicReviewTable() {
  if (tableReady) return
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TopicReview" (
      id          TEXT PRIMARY KEY,
      "marketId"  TEXT NOT NULL,
      "userId"    TEXT NOT NULL,
      status      TEXT NOT NULL,
      reason      TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT current_timestamp
    )
  `)
  tableReady = true
}

export async function recordTopicReview(
  marketId: string,
  userId: string,
  status: 'APPROVED' | 'REJECTED',
  reason?: string
) {
  await ensureTopicReviewTable()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "TopicReview" (id, "marketId", "userId", status, reason) VALUES ($1, $2, $3, $4, $5)`,
    randomUUID(),
    marketId,
    userId,
    status,
    reason ?? null
  )
}

export interface TopicReviewRow {
  marketId: string
  title: string
  status: 'APPROVED' | 'REJECTED'
  reason: string | null
  createdAt: Date
}

export async function listTopicReviews(userId: string, limit = 10): Promise<TopicReviewRow[]> {
  await ensureTopicReviewTable()
  return prisma.$queryRawUnsafe<TopicReviewRow[]>(
    `SELECT r."marketId", m.title, r.status, r.reason, r."createdAt"
     FROM "TopicReview" r
     JOIN "Market" m ON m.id = r."marketId"
     WHERE r."userId" = $1
     ORDER BY r."createdAt" DESC
     LIMIT ${Math.min(Math.max(limit, 1), 50)}`,
    userId
  )
}
