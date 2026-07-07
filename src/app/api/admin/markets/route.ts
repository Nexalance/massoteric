export const dynamic = 'force-dynamic'
// src/app/api/admin/markets/route.ts
// Admin: list markets for resolution
// GET — list markets awaiting resolution (OPEN or CLOSED status)

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MarketStatus } from '@prisma/client'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const markets = await prisma.market.findMany({
    where: {
      source: 'USER_CREATED',
      status: { in: [MarketStatus.OPEN, MarketStatus.CLOSED] },
    },
    orderBy: { resolvesAt: 'asc' }, // Earliest resolving first
    include: {
      createdBy: {
        select: { id: true, username: true, displayName: true },
      },
      _count: { select: { predictions: true } },
    },
  })

  return NextResponse.json({ markets })
}
