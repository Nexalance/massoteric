export const dynamic = 'force-dynamic'
// src/app/api/predictions/route.ts
// GET  /api/predictions  — list predictions (with access control on reasoning)
// POST /api/predictions  — create a prediction (requires auth)

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  isPredictionLocked,
  generateReasoningSnippet,
} from '@/lib/scoring'
import { canAccess } from '@/lib/access'
import { FeatureKey } from '@prisma/client'

// ── GET: list predictions for a market ──────────────────────────────────────

const ListSchema = z.object({
  marketId: z.string(),
  sortBy: z.enum(['accuracy', 'recent', 'probability']).default('accuracy'),
  userId: z.string().optional(),  // filter by user
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
})

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth()
  const { searchParams } = new URL(req.url)
  const query = ListSchema.safeParse(Object.fromEntries(searchParams))

  if (!query.success) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const { marketId, sortBy, userId: filterUserId, page, limit } = query.data
  const skip = (page - 1) * limit

  // Determine viewer's tier for access control
  let viewerTier = 'FREE' as const
  let canSeeFullReasoning = false
  let canFilterByUser = false

  if (clerkId) {
    const viewer = await prisma.user.findUnique({ where: { clerkId } })
    if (viewer) {
      viewerTier = viewer.subscriptionTier
      canSeeFullReasoning = await canAccess(viewer.subscriptionTier, FeatureKey.FULL_REASONING)
      canFilterByUser = await canAccess(viewer.subscriptionTier, FeatureKey.USER_FILTER)
    }
  }

  // Block user filter for free users
  if (filterUserId && !canFilterByUser) {
    return NextResponse.json(
      { error: 'Upgrade required to filter by user', upgradeRequired: true },
      { status: 403 }
    )
  }

  const orderBy = sortBy === 'accuracy'
    ? { user: { accuracyScores: { _count: 'desc' } } }
    : sortBy === 'recent'
    ? { createdAt: 'desc' }
    : { probability: 'desc' }

  const predictions = await prisma.prediction.findMany({
    where: {
      marketId,
      ...(filterUserId && { userId: filterUserId }),
      status: { not: 'ACTIVE' === 'ACTIVE' ? undefined : undefined }, // show all statuses
    },
    skip,
    take: limit,
    orderBy: [{ createdAt: 'desc' }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          subscriptionTier: true,
          accuracyScores: {
            where: { category: null }, // overall score
            select: { accuracyPct: true, scoredPredictions: true },
          },
        },
      },
      edits: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          previousProbability: true,
          editReason: true,
          createdAt: true,
        },
      },
    },
  })

  // Apply access control to reasoning field
  const sanitized = predictions.map(p => ({
    ...p,
    reasoning: canSeeFullReasoning ? p.reasoning : null,
    reasoningSnippet: p.reasoningSnippet,
    _reasoningLocked: !canSeeFullReasoning,
  }))

  const total = await prisma.prediction.count({ where: { marketId } })

  return NextResponse.json({
    predictions: sanitized,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    access: { canSeeFullReasoning, viewerTier },
  })
}

// ── POST: create or update a prediction ─────────────────────────────────────

const CreateSchema = z.object({
  marketId: z.string(),
  probability: z.number().min(0.01).max(0.99),  // can't predict 0% or 100%
  reasoning: z.string().min(50, 'Please provide at least 50 characters of reasoning').max(5000),
  editReason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { marketId, probability, reasoning, editReason } = parsed.data

  // Check market exists and is open
  const market = await prisma.market.findUnique({ where: { id: marketId } })
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  if (market.status !== 'OPEN') {
    return NextResponse.json({ error: 'Market is closed' }, { status: 400 })
  }

  // Check prediction lock window
  if (isPredictionLocked(market.closesAt)) {
    return NextResponse.json(
      { error: 'Predictions are locked within 48 hours of market close' },
      { status: 400 }
    )
  }

  const snippet = generateReasoningSnippet(reasoning)

  // Check if user already has a prediction
  const existing = await prisma.prediction.findUnique({
    where: { userId_marketId: { userId: user.id, marketId } },
  })

  if (existing) {
    // Log the edit history first
    await prisma.predictionEdit.create({
      data: {
        predictionId: existing.id,
        userId: user.id,
        previousProbability: existing.probability,
        previousReasoning: existing.reasoning,
        editReason: editReason || null,
      },
    })

    // Update the prediction
    const updated = await prisma.prediction.update({
      where: { id: existing.id },
      data: { probability, reasoning, reasoningSnippet: snippet },
    })

    return NextResponse.json({ prediction: updated, action: 'updated' })
  }

  // Create new prediction
  const prediction = await prisma.prediction.create({
    data: {
      userId: user.id,
      marketId,
      probability,
      reasoning,
      reasoningSnippet: snippet,
      status: isPredictionLocked(market.closesAt) ? 'LOCKED' : 'ACTIVE',
    },
  })

  // Update total prediction count on accuracy score
  await prisma.accuracyScore.upsert({
    where: { userId_category: { userId: user.id, category: null } },
    update: { totalPredictions: { increment: 1 } },
    create: {
      userId: user.id,
      category: undefined,
      totalPredictions: 1,
      scoredPredictions: 0,
      totalBrierScore: 0,
    },
  })

  return NextResponse.json({ prediction, action: 'created' }, { status: 201 })
}
