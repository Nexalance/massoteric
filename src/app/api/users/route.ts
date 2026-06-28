// src/app/api/users/route.ts
// GET /api/users — leaderboard / user search

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MarketCategory } from '@prisma/client'
import { z } from 'zod'

const LeaderboardSchema = z.object({
  category: z.nativeEnum(MarketCategory).optional(),
  period: z.enum(['all', '90d', '30d']).default('all'),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = LeaderboardSchema.safeParse(Object.fromEntries(searchParams))

  if (!query.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const { category, page, limit } = query.data
  const skip = (page - 1) * limit

  // Get users ordered by accuracy score (overall or by category)
  const scores = await prisma.accuracyScore.findMany({
    where: {
      category: category ?? null,
      scoredPredictions: { gte: 3 }, // minimum predictions to appear on leaderboard
    },
    orderBy: { avgBrierScore: 'asc' }, // lower brier = more accurate
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          occupation: true,
          subscriptionTier: true,
          _count: { select: { predictions: true, subscribers: true } },
        },
      },
    },
  })

  const total = await prisma.accuracyScore.count({
    where: {
      category: category ?? null,
      scoredPredictions: { gte: 3 },
    },
  })

  const ranked = scores.map((score, index) => ({
    rank: skip + index + 1,
    user: score.user,
    accuracyPct: score.accuracyPct,
    avgBrierScore: score.avgBrierScore,
    totalPredictions: score.totalPredictions,
    scoredPredictions: score.scoredPredictions,
    category: score.category,
  }))

  return NextResponse.json({
    leaderboard: ranked,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}
