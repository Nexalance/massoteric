export const dynamic = 'force-dynamic'
// src/app/api/billing/checkout/route.ts

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { SubscriptionTier } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const TIER_PRICES: Record<string, string> = {
  STANDARD: process.env.STRIPE_PRICE_STANDARD!,
  PRO: process.env.STRIPE_PRICE_PRO!,
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Check if Stripe is properly configured
  if (!isStripeConfigured()) {
    return NextResponse.json({
      error: 'Stripe is not configured',
      message: 'Subscriptions are not available. Please contact support to upgrade your account.'
    }, { status: 503 })
  }

  const formData = await req.formData()
  const tier = formData.get('tier') as SubscriptionTier

  const priceId = TIER_PRICES[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  try {
    const url = await createCheckoutSession(user.id, priceId, tier)
    // Return JSON with URL for JavaScript redirect (more reliable than form redirect)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
