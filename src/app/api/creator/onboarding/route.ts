// src/app/api/creator/onboarding/route.ts
// Stripe Connect onboarding for creators

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { createCreatorAccount, getOrCreateCreatorSettings } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up DB user by Clerk ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const userId = dbUser.id

    // Check if user can become a creator (basic requirements)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { creatorSettings: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create or get creator settings
    await getOrCreateCreatorSettings(userId)

    // Create Stripe Connect account and get onboarding URL
    const { accountId, url } = await createCreatorAccount(userId)

    return NextResponse.json({
      success: true,
      accountId,
      url,
    })
  } catch (error) {
    console.error('Creator onboarding error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start creator onboarding',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      include: { creatorSettings: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasStripeAccount: !!user.stripeAccountId,
      onboardingComplete: user.stripeOnboardingComplete,
      settings: user.creatorSettings,
    })
  } catch (error) {
    console.error('Get creator status error:', error)
    return NextResponse.json(
      { error: 'Failed to get creator status' },
      { status: 500 }
    )
  }
}
