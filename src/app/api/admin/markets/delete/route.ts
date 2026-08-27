export const dynamic = 'force-dynamic'
// src/app/api/admin/markets/delete/route.ts
// Admin: permanently delete a market (e.g., nonsense/junk topics)
// DELETE — removes the market and (via Prisma cascade) its predictions and comments

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

const DeleteSchema = z.object({
  marketId: z.string().cuid(),
})

export async function DELETE(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json()
  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { marketId } = parsed.data

  try {
    // Get market info first for the response (and to warn if it has predictions)
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { _count: { select: { predictions: true, comments: true } } },
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Delete — cascades to predictions, comments
    await prisma.market.delete({ where: { id: marketId } })

    return NextResponse.json({
      success: true,
      deleted: {
        id: market.id,
        title: market.title,
        predictionsRemoved: market._count.predictions,
        commentsRemoved: market._count.comments,
      },
    })
  } catch (error) {
    console.error('Failed to delete market:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete market' },
      { status: 500 }
    )
  }
}
