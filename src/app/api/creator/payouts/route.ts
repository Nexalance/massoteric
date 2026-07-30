// src/app/api/creator/payouts/route.ts
// Creator payout request API

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const payoutRequestSchema = z.object({
  amountCents: z.number().int().positive().max(1000000), // Max $10,000
})

// GET - List payout requests for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const payouts = await prisma.payout.findMany({
      where: { userId: dbUser.id },
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error('List payouts error:', error)
    return NextResponse.json(
      { error: 'Failed to list payouts' },
      { status: 500 }
    )
  }
}

// POST - Create a payout request (for admin approval)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId },
      select: { id: true, stripeAccountId: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Check if Stripe Connect is set up
    if (!dbUser.stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe Connect account not set up. Please complete onboarding first.' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validated = payoutRequestSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }

    const { amountCents } = validated.data
    const amount = amountCents / 100 // Convert to dollars

    // Create payout request in PENDING status
    // It will be processed by admin approval
    const payout = await prisma.payout.create({
      data: {
        userId: dbUser.id,
        amountCents,
        status: 'PENDING',
        notes: `Payout request of $${amount.toFixed(2)} - awaiting admin approval`,
      },
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amountCents: payout.amountCents,
        status: payout.status,
        requestedAt: payout.requestedAt,
      },
    })
  } catch (error) {
    console.error('Create payout request error:', error)
    return NextResponse.json(
      { error: 'Failed to create payout request' },
      { status: 500 }
    )
  }
}
