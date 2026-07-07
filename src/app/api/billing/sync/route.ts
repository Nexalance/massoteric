export const dynamic = 'force-dynamic'
// src/app/api/billing/sync/route.ts
// Manual sync endpoint to refresh subscription status from Stripe
// Useful as a fallback if webhooks fail

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { syncSubscriptionFromStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Use the shared sync function from stripe.ts
  const result = await syncSubscriptionFromStripe(user.id)

  if (!result.success) {
    const statusCode = result.error === 'Stripe not configured' ? 503 :
                       result.error === 'No Stripe customer found' ? 400 : 500
    return NextResponse.json({ error: result.error }, { status: statusCode })
  }

  return NextResponse.json(result)
}
