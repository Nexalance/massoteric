export const dynamic = 'force-dynamic'
// src/app/api/markets/[id]/comments/route.ts
// Threaded comments/discussion for a market, gated by two admin feature
// flags (COMMENTS_VIEW / COMMENTS_CREATE) so discussions can be turned on
// or off, and viewing and/or posting can be restricted to paid subscribers.

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SubscriptionTier } from '@prisma/client'
import { getCommentsAccess } from '@/lib/comments-access'

interface CommentRow {
  id: string
  parentId: string | null
  body: string
  isDeleted: boolean
  createdAt: Date
  user: { username: string | null; displayName: string; subscriptionTier: string | null } | null
  votes: { value: number }[]
}

function shapeComment(c: CommentRow, viewerUserId: string | null) {
  return {
    id: c.id,
    parentId: c.parentId,
    body: c.isDeleted ? '[deleted]' : c.body,
    isDeleted: c.isDeleted,
    createdAt: c.createdAt,
    author: c.user
      ? { username: c.user.username, displayName: c.user.displayName, tier: c.user.subscriptionTier }
      : null,
    score: c.votes.reduce((sum, v) => sum + v.value, 0),
    myVote: viewerUserId ? (c.votes.find(v => (v as { userId?: string }).userId)?.value ?? 0) : 0,
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()

  let viewer: { id: string; subscriptionTier: string | null } | null = null
  if (clerkId) {
    viewer = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, subscriptionTier: true },
    })
  }

  const access = await getCommentsAccess({
    signedIn: !!viewer,
    tier: (viewer?.subscriptionTier ?? null) as SubscriptionTier | null,
    clerkId,
  })

  if (!access.featureEnabled) {
    return NextResponse.json({ featureEnabled: false, canView: false, canCreate: false, signedIn: !!clerkId, comments: [] })
  }

  if (!access.canView) {
    // The section shows an upgrade prompt only when viewing is paywalled
    // (flag on but paid-only); a fully disabled flag renders nothing client-side.
    return NextResponse.json({ featureEnabled: true, canView: false, canCreate: access.canCreate, signedIn: !!clerkId, comments: [] })
  }

  const market = await prisma.market.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })

  const rows = await prisma.comment.findMany({
    where: { marketId: params.id },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { username: true, displayName: true, subscriptionTier: true } },
      votes: { select: { value: true, userId: true } },
    },
  }) as unknown as CommentRow[]

  const shaped = rows.map(c => shapeComment(c, viewer?.id ?? null))
  const byId = new Map(shaped.map(c => [c.id, { ...c, replies: [] as (typeof shaped[number] & { replies: unknown[] })[] }]))
  const roots: (typeof shaped[number] & { replies: unknown[] })[] = []
  for (const c of Array.from(byId.values())) {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId)!.replies.push(c)
    else roots.push(c)
  }
  // Drop soft-deleted leaves entirely; keep them as "[deleted]" placeholders
  // only when they still hold replies (so the thread structure stays intact).
  const prune = (list: (typeof shaped[number] & { replies: unknown[] })[]) => {
    for (const c of list) prune(c.replies as never)
    return list.filter(c => !c.isDeleted || (c.replies as unknown[]).length > 0)
  }

  return NextResponse.json({
    featureEnabled: true,
    canView: true,
    canCreate: access.canCreate,
    signedIn: !!viewer,
    comments: prune(roots),
  })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, subscriptionTier: true },
  })
  if (!user) return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 })

  const access = await getCommentsAccess({ signedIn: true, tier: user.subscriptionTier, clerkId })
  if (!access.canCreate) {
    return NextResponse.json(
      { error: 'Commenting is limited to paid subscribers', upgradeRequired: true },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (text.length < 1 || text.length > 2000) {
    return NextResponse.json({ error: 'Comment must be 1–2000 characters' }, { status: 400 })
  }

  const market = await prisma.market.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 })

  let parentId: string | null = null
  if (body.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: body.parentId } })
    if (!parent || parent.marketId !== params.id) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
    }
    parentId = parent.id
  }

  const comment = await prisma.comment.create({
    data: { marketId: params.id, userId: user.id, body: text, parentId },
    include: { user: { select: { username: true, displayName: true, subscriptionTier: true } } },
  })

  return NextResponse.json({
    comment: {
      id: comment.id,
      parentId: comment.parentId,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.user,
      score: 0,
      replies: [],
    },
  }, { status: 201 })
}
