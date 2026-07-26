export const dynamic = 'force-dynamic'
// src/app/api/search/route.ts
// GET /api/search?q=keyword — instant search across OPEN markets
// Searches title, description, and tags (case-insensitive).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MarketStatus, MarketSource, TopicStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  // Require at least 2 characters to avoid noisy queries
  if (q.length < 2) {
    return NextResponse.json({ markets: [] })
  }

  const now = new Date()

  const where = {
    status: MarketStatus.OPEN,
    AND: [
      // Not yet closed / resolved
      { OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
      { OR: [{ resolvesAt: null }, { resolvesAt: { gte: now } }] },
      // Only approved user topics
      {
        OR: [
          { source: { not: MarketSource.USER_CREATED } },
          { source: MarketSource.USER_CREATED, topicStatus: TopicStatus.APPROVED },
        ],
      },
      // Match the query against title / description / tags
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
          { tags: { has: q } },
        ],
      },
    ],
  }

  const markets = await prisma.market.findMany({
    where,
    take: limit,
    orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }],
    select: {
      id: true,
      title: true,
      category: true,
      marketProbability: true,
      closesAt: true,
      source: true,
    },
  })

  return NextResponse.json({ markets })
}
