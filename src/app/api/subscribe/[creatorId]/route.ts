// src/app/api/subscribe/[creatorId]/route.ts
// Subscribe to a creator (paid subscription)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { createCreatorSubscriptionCheckout } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve DB user from Clerk ID (session.userId is clerkId, not DB user.id)
    const subscriber = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const subscriberId = subscriber.id
    const creatorId = params.creatorId

    // Prevent self-subscription
    if (subscriberId === creatorId) {
      return NextResponse.json({ error: 'Cannot subscribe to yourself' }, { status: 400 })
    }

    // Check if creator exists and is ready for subscriptions
    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      include: { creatorSettings: true },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    if (!creator.stripeAccountId) {
      return NextResponse.json(
        { error: 'This creator has not set up subscriptions yet' },
        { status: 400 }
      )
    }

    if (!creator.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'This creator is still setting up their payment account' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existingSubscription = await prisma.userSubscription.findUnique({
      where: {
        subscriberId_expertId: {
          subscriberId,
          expertId: creatorId,
        },
      },
    })

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'You are already subscribed to this creator' },
        { status: 400 }
      )
    }

    // Create checkout session
    const { url, subscriptionId } = await createCreatorSubscriptionCheckout(
      subscriberId,
      creatorId
    )

    return NextResponse.json({
      success: true,
      url,
      subscriptionId,
      creator: {
        id: creator.id,
        username: creator.username,
        displayName: creator.displayName,
        monthlyPrice: (creator.creatorSettings?.monthlyPriceCents || 999) / 100,
      },
    })
  } catch (error) {
    console.error('Subscribe to creator error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription checkout' },
      { status: 500 }
    )
  }
}

// Check subscription status
export async function GET(
  req: NextRequest,
  { params }: { params: { creatorId: string } }
) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve DB user from Clerk ID
    const subscriber = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    })

    if (!subscriber) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 401 })
    }

    const subscription = await prisma.userSubscription.findUnique({
      where: {
        subscriberId_expertId: {
          subscriberId: subscriber.id,
          expertId: params.creatorId,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ subscribed: false })
    }

    return NextResponse.json({
      subscribed: true,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      monthlyPrice: subscription.monthlyPriceCents / 100,
    })
  } catch (error) {
    console.error('Check subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    )
  }
}
