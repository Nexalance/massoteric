export const dynamic = 'force-dynamic'
// src/app/api/admin/topics/route.ts
// Admin: moderate user-submitted topics
// GET   — list pending topics
// PATCH — approve or reject a topic

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TopicStatus } from '@prisma/client'
import { recordTopicReview } from '@/lib/topicReview'
import { z } from 'zod'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',')
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const { searchParams } = new URL(req.url)
  const status = (searchParams.get('status') as TopicStatus) || 'PENDING'

  const topics = await prisma.market.findMany({
    where: { source: 'USER_CREATED', topicStatus: status },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, username: true, displayName: true, email: true },
      },
      _count: { select: { predictions: true } },
    },
  })

  return NextResponse.json({ topics })
}

const PatchSchema = z.object({
  topicId: z.string(),
  status: z.nativeEnum(TopicStatus).optional(),
  rejectionReason: z.string().max(1000).optional(),
  edits: z.object({
    title: z.string().min(10).max(300).optional(),
    description: z.string().max(2000).nullable().optional(),
    resolutionCriteria: z.string().min(20).max(1000).optional(),
    closesAt: z.string().optional(),
  }).strict().optional(),
})

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { topicId, status, edits, rejectionReason } = parsed.data
  if (!status && !edits) {
    return NextResponse.json({ error: 'Nothing to do — pass status and/or edits' }, { status: 400 })
  }

  // The topic must exist and be a user submission (never touch synced markets)
  const topic = await prisma.market.findUnique({ where: { id: topicId } })
  if (!topic || topic.source !== 'USER_CREATED') {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
  }

  // 1. Apply requested edits (admin fix-ups before approving)
  const updateData: Record<string, unknown> = {}
  if (edits) {
    if (edits.title !== undefined) updateData.title = edits.title
    if (edits.description !== undefined) updateData.description = edits.description
    if (edits.resolutionCriteria !== undefined) updateData.resolutionCriteria = edits.resolutionCriteria
    if (edits.closesAt !== undefined) {
      const closeDate = new Date(edits.closesAt)
      if (isNaN(closeDate.getTime())) {
        return NextResponse.json({ error: 'Invalid closing date' }, { status: 400 })
      }
      updateData.closesAt = closeDate
      updateData.resolvesAt = closeDate
    }
  }
  if (status) updateData.topicStatus = status

  const updated = await prisma.market.update({
    where: { id: topicId },
    data: updateData,
  })

  // 2. Record the review outcome so the creator gets informed (their topic
  //    form surfaces the notice — there is no separate notification system)
  if (status === 'APPROVED' || status === 'REJECTED') {
    try {
      await recordTopicReview(topicId, topic.createdByUserId || '', status, status === 'REJECTED' ? rejectionReason : undefined)
    } catch (err) {
      console.error('[admin/topics] failed to record review feedback:', err)
    }
  }

  return NextResponse.json({ topic: updated })
}
