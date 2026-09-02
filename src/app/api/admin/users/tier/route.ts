export const dynamic = 'force-dynamic'
// src/app/api/admin/users/tier/route.ts
// Admin: change a user's subscription tier (e.g. grant FREE PRO access).
// PATCH { userId, tier }

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SubscriptionTier } from '@prisma/client'
import { z } from 'zod'
import { isAdmin } from '@/lib/admin'

const TierSchema = z.object({
  userId: z.string().cuid(),
  tier: z.nativeEnum(SubscriptionTier),
})

export async function PATCH(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(clerkId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = TierSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { userId, tier } = parsed.data

  // Prevent demoting yourself accidentally
  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
      // Manual grant — mark status so it reads as admin-managed, not a Stripe sub
      ...(tier !== 'FREE' ? { subscriptionStatus: 'ACTIVE' } : {}),
    },
    select: { id: true, username: true, subscriptionTier: true, subscriptionStatus: true },
  })

  return NextResponse.json({ success: true, user: updated })
}
