// src/app/api/admin/topics/route.ts
// Admin: moderate user-submitted topics
// GET   — list pending topics
// PATCH — approve or reject a topic

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TopicStatus } from '@prisma/client'
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
  status: z.nativeEnum(TopicStatus),
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

  const updated = await prisma.market.update({
    where: { id: parsed.data.topicId },
    data: { topicStatus: parsed.data.status },
  })

  return NextResponse.json({ topic: updated })
}
