// src/app/api/creator/dashboard/route.ts
// Creator dashboard stats and earnings

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { getCreatorStats } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

    const stats = await getCreatorStats(dbUser.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Creator dashboard error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get creator stats' },
      { status: 500 }
    )
  }
}
