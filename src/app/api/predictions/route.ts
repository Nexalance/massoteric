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

  // Build orderBy based on sortBy parameter
  // Note: accuracy sorting by scoredPredictions requires complex join; using createdAt as fallback
  const orderBy = sortBy === 'accuracy'
    ? { createdAt: 'desc' }  // TODO: implement accuracy ranking via separate query
    : sortBy === 'recent'
    ? { createdAt: 'desc' }
    : { probability: 'desc' }

  const predictions = await prisma.prediction.findMany({
    where: {
      marketId,
      ...(filterUserId && { userId: filterUserId }),
    },
    skip,
    take: limit,
    orderBy,
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
  probability_range: z.coerce.number().min(1).max(99).optional(),  // from form (1-99)
  probability: z.number().min(0.01).max(0.99).optional(),  // from JSON (0.01-0.99)
  reasoning: z.string().min(50, 'Please provide at least 50 characters of reasoning').max(5000),
  editReason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, isSuspended: true, subscriptionTier: true }
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.isSuspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

    // Check if user can submit predictions (FREE tier cannot)
    if (user.subscriptionTier === 'FREE') {
      return NextResponse.json({
        error: 'Upgrade required',
        message: 'Prediction submission is available for Standard and Pro subscribers. Upgrade to share your forecasts with the community.',
        requiresUpgrade: true
      }, { status: 403 })
    }

    // Handle both form-data and JSON
    const contentType = req.headers.get('content-type') || ''
    let body: any
    const isFormSubmission = contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')

    if (isFormSubmission) {
      const formData = await req.formData()
      body = Object.fromEntries(formData.entries())
      // Convert string values to appropriate types
      if (body.probability_range) body.probability_range = Number(body.probability_range)
    } else {
      body = await req.json()
    }

    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { marketId, probability_range, probability, reasoning, editReason } = parsed.data

    // Convert probability_range (1-99) to probability (0.01-0.99)
    const finalProbability = probability ?? (probability_range ? probability_range / 100 : undefined)
    if (!finalProbability) {
      return NextResponse.json({ error: 'Probability is required' }, { status: 400 })
    }

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
        data: { probability: finalProbability, reasoning, reasoningSnippet: snippet },
      })

      // Redirect back to market page for form submissions, return JSON for API calls
      if (isFormSubmission) {
        return NextResponse.redirect(new URL(`/market/${marketId}`, req.url), 303)
      }
      return NextResponse.json({ prediction: updated, action: 'updated' })
    }

    // Create new prediction
    const prediction = await prisma.prediction.create({
      data: {
        userId: user.id,
        marketId,
        probability: finalProbability,
        reasoning,
        reasoningSnippet: snippet,
        status: isPredictionLocked(market.closesAt) ? 'LOCKED' : 'ACTIVE',
      },
    })

    // Update total prediction count on accuracy score (only if market has a category)
    if (market.category) {
      await prisma.accuracyScore.upsert({
        where: { userId_category: { userId: user.id, category: market.category } },
        update: { totalPredictions: { increment: 1 } },
        create: {
          userId: user.id,
          category: market.category,
          totalPredictions: 1,
          scoredPredictions: 0,
          totalBrierScore: 0,
        },
      })
    }

    // Redirect back to market page for form submissions, return JSON for API calls
    if (isFormSubmission) {
      return NextResponse.redirect(new URL(`/market/${marketId}`, req.url), 303)
    }
    return NextResponse.json({ prediction, action: 'created' }, { status: 201 })

  } catch (error) {
    console.error('❌ Error in POST /api/predictions:', error)

    // Handle Prisma-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } }

      // Unique constraint violation (user already has a prediction)
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          error: 'You have already submitted a prediction for this market'
        }, { status: 409 })
      }

      // Foreign key constraint (market or user not found)
      if (prismaError.code === 'P2003') {
        return NextResponse.json({
          error: 'Invalid market or user reference'
        }, { status: 400 })
      }

      // Record not found (race condition)
      if (prismaError.code === 'P2025') {
        return NextResponse.json({
          error: 'Resource not found'
        }, { status: 404 })
      }
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to submit prediction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
