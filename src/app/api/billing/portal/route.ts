export const dynamic = 'force-dynamic'
// src/app/api/billing/portal/route.ts
// Create Stripe Customer Portal session for managing subscriptions

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    const url = await createPortalSession(user.id)
    // Return JSON with URL for JavaScript redirect (more reliable than form redirect)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
