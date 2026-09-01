export const dynamic = 'force-dynamic'
// src/app/api/feature-access/route.ts
// GET /api/feature-access?feature=TOPIC_CREATE
// Returns whether the CURRENT logged-in user can access a feature.
// Mirrors the server-side canAccess() logic so client components
// (e.g. /market/new) respect admin feature-flag toggles.

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FeatureKey } from '@prisma/client'
import { canAccess } from '@/lib/access'
import { isAdmin } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const featureParam = req.nextUrl.searchParams.get('feature')

  if (!featureParam || !(Object.values(FeatureKey) as string[]).includes(featureParam)) {
    return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
  }

  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ authenticated: false, canAccess: false })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { subscriptionTier: true },
  })

  if (!user) {
    return NextResponse.json({ authenticated: true, canAccess: false })
  }

  const allowed = await canAccess(user.subscriptionTier, featureParam as FeatureKey, isAdmin(clerkId))
  return NextResponse.json({ authenticated: true, canAccess: allowed, tier: user.subscriptionTier })
}
