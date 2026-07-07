export const dynamic = 'force-dynamic'
// src/app/api/admin/markets/resolve/route.ts
// Admin: manually resolve a market and trigger scoring
// PATCH — resolve a market as YES or NO

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { scoreMarket } from '@/lib/scoring'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

const ResolveSchema = z.object({
  marketId: z.string().cuid(),
  outcome: z.boolean(), // true = YES, false = NO
})

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json()
  const parsed = ResolveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { marketId, outcome } = parsed.data

  try {
    // Update market as resolved
    const market = await prisma.market.update({
      where: { id: marketId },
      data: {
        status: 'RESOLVED',
        resolvedValue: outcome,
        resolvedAt: new Date(),
      },
    })

    // Trigger scoring for all predictions
    await scoreMarket(marketId, outcome)

    return NextResponse.json({
      success: true,
      market: {
        id: market.id,
        title: market.title,
        resolvedValue: outcome,
        resolvedAt: market.resolvedAt,
      },
    })
  } catch (error) {
    console.error('Failed to resolve market:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve market' },
      { status: 500 }
    )
  }
}
