export const dynamic = 'force-dynamic'
// src/app/api/admin/markets/merge/route.ts
// Admin: merge a duplicate market into its canonical twin.
// Moves predictions and comments onto the target market, then deletes the
// source. Built for the legacy Polymarket clone rows ({eventId}-{subcategory})
// whose predictions must survive the cleanup — a plain delete would cascade
// them away, and sync keeps recreating the bare-id row, so the clone can't
// simply be kept either.

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

const MergeSchema = z.object({
  fromMarketId: z.string().cuid(), // duplicate — moved over, then deleted
  toMarketId: z.string().cuid(),   // canonical — stays, keeps receiving sync updates
})

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json()
  const parsed = MergeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { fromMarketId, toMarketId } = parsed.data
  if (fromMarketId === toMarketId) {
    return NextResponse.json({ error: 'Cannot merge a market into itself' }, { status: 400 })
  }

  try {
    const [from, to] = await Promise.all([
      prisma.market.findUnique({
        where: { id: fromMarketId },
        include: { _count: { select: { predictions: true, comments: true } } },
      }),
      prisma.market.findUnique({ where: { id: toMarketId }, select: { id: true, externalId: true } }),
    ])
    if (!from || !to) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Move predictions; if the same user predicted on both rows, keep the
    // canonical row's prediction and drop the clone's (unique constraint).
    const preds = await prisma.prediction.findMany({
      where: { marketId: from.id },
      select: { id: true, userId: true },
    })
    let movedPredictions = 0
    let droppedDuplicates = 0
    for (const p of preds) {
      const clash = await prisma.prediction.findFirst({ where: { marketId: to.id, userId: p.userId } })
      if (clash) {
        await prisma.prediction.delete({ where: { id: p.id } })
        droppedDuplicates++
      } else {
        await prisma.prediction.update({ where: { id: p.id }, data: { marketId: to.id } })
        movedPredictions++
      }
    }

    const comments = await prisma.comment.updateMany({
      where: { marketId: from.id },
      data: { marketId: to.id },
    })

    await prisma.market.delete({ where: { id: from.id } })

    return NextResponse.json({
      success: true,
      movedPredictions,
      droppedDuplicates,
      commentsMoved: comments.count,
      deleted: { id: from.id, externalId: from.externalId, title: from.title },
      kept: { id: to.id, externalId: to.externalId },
    })
  } catch (error) {
    console.error('Failed to merge market:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to merge market',
    }, { status: 500 })
  }
}
