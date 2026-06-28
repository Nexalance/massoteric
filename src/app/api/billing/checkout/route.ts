// src/app/api/billing/checkout/route.ts

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
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

  const formData = await req.formData()
  const tier = formData.get('tier') as SubscriptionTier

  const priceId = TIER_PRICES[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const url = await createCheckoutSession(user.id, priceId, tier)
  return NextResponse.redirect(url)
}
