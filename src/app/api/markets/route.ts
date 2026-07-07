export const dynamic = 'force-dynamic'
// src/app/api/markets/route.ts
// GET  /api/markets  — list markets with filters
// POST /api/markets  — create user-submitted topic (requires auth)

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MarketCategory, MarketStatus, MarketSource, FeatureKey } from '@prisma/client'
import { z } from 'zod'
import { canAccess } from '@/lib/access'
import { ensureFeatureFlags } from '@/lib/init-feature-flags'

const ListSchema = z.object({
  category: z.nativeEnum(MarketCategory).optional(),
  source: z.nativeEnum(MarketSource).optional(),
  status: z.nativeEnum(MarketStatus).optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(50).default(20),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = ListSchema.safeParse(Object.fromEntries(searchParams))

  if (!query.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
  }

  const { category, source, status, featured, search, page, limit } = query.data
  const skip = (page - 1) * limit

  const where = {
    ...(category && { category }),
    ...(source && { source }),
    ...(status ? { status } : { status: MarketStatus.OPEN }),
    ...(featured !== undefined && { featured }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    // Only show approved user topics
    OR: [
      { source: { not: MarketSource.USER_CREATED } },
      { source: MarketSource.USER_CREATED, topicStatus: 'APPROVED' },
    ],
  }

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ featured: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { predictions: true, comments: true } },
      },
    }),
    prisma.market.count({ where }),
  ])

  return NextResponse.json({
    markets,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}

const CreateTopicSchema = z.object({
  title: z.string().min(10).max(300),
  description: z.string().min(20).max(2000),
  category: z.nativeEnum(MarketCategory),
  resolutionCriteria: z.string().min(20).max(1000),
  closesAt: z.string().nullable().optional().transform(val => {
    // Handle empty, null, undefined
    if (!val || val === '' || val === null) return undefined

    // Handle datetime-local format (YYYY-MM-DDTHH:mm) - add seconds and UTC
    // HTML datetime-local returns format like "2024-12-31T23:59"
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return val + ':00Z' // Add seconds and UTC timezone
    }

    // Handle formats without timezone - append Z
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
      return val + 'Z'
    }

    // Already has timezone or is invalid, return as-is
    return val
  }),
  resolvesAt: z.string().nullable().optional().transform(val => {
    // Handle empty, null, undefined
    if (!val || val === '' || val === null) return undefined

    // Handle datetime-local format (YYYY-MM-DDTHH:mm) - add seconds and UTC
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      return val + ':00Z'
    }

    // Handle formats without timezone - append Z
    if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
      return val + 'Z'
    }

    return val
  }),
  tags: z.array(z.string()).max(5).default([]),
})

export async function POST(req: NextRequest) {
  // Ensure feature flags exist in database (one-time setup)
  await ensureFeatureFlags()

  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({
      error: 'Authentication required',
      message: 'Please sign in to create topics.'
    }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json({
      error: 'User not found',
      message: 'Your account could not be found. Please try signing out and back in.'
    }, { status: 404 })
  }

  // Check if user has permission to create topics
  const canCreate = await canAccess(user.subscriptionTier, FeatureKey.TOPIC_CREATE)
  if (!canCreate) {
    return NextResponse.json({
      error: 'Upgrade required',
      message: 'Topic creation is available for Standard and Pro subscribers. Upgrade to create your own prediction markets.',
      tier: user.subscriptionTier,
      requiresUpgrade: true
    }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateTopicSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, category, resolutionCriteria, closesAt, resolvesAt, tags } = parsed.data

  const topic = await prisma.market.create({
    data: {
      source: MarketSource.USER_CREATED,
      category,
      title,
      description,
      resolutionCriteria,
      closesAt: closesAt ? new Date(closesAt) : null,
      resolvesAt: resolvesAt ? new Date(resolvesAt) : (closesAt ? new Date(closesAt) : null), // Default to closesAt if resolvesAt not provided
      tags,
      status: MarketStatus.OPEN,
      topicStatus: 'PENDING',
      createdByUserId: user.id,
    },
  })

  return NextResponse.json({ topic }, { status: 201 })
}
