// src/app/api/admin/scoring/route.ts
// Admin: Run scoring engine for resolved markets

import { auth } from '@/lib/auth-mock'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreMarket } from '@/lib/scoring'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

export async function POST() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireAdmin(clerkId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get all resolved markets that haven't been scored yet
    const resolvedMarkets = await prisma.market.findMany({
      where: {
        status: 'RESOLVED',
        resolvedValue: { not: null },
      },
      select: {
        id: true,
        title: true,
        resolvedValue: true,
      },
    })

    let scoredCount = 0
    const errors: string[] = []

    for (const market of resolvedMarkets) {
      try {
        const outcome = market.resolvedValue === 'YES'
        await scoreMarket(market.id, outcome)
        scoredCount++
      } catch (error) {
        errors.push(`${market.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      scored: scoredCount,
      total: resolvedMarkets.length,
      errors: errors.length,
      errorDetails: errors,
    })
  } catch (error) {
    console.error('Scoring error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
