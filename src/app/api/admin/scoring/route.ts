// src/app/api/admin/scoring/route.ts
// Admin: Run scoring engine for resolved markets
// POST — admin UI button (Clerk session auth)
// GET  — external cron server (secret auth: ?secret=CRON_SECRET or Authorization: Bearer)

import { auth } from '@/lib/auth-mock'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreMarket } from '@/lib/scoring'

// Allow up to 5 minutes on Vercel Pro — scoring loops over markets with pending predictions
export const maxDuration = 300

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

// Fixed public passphrase — cron server just appends ?secret=ploySecret
const CRON_PASSPHRASE = 'ploySecret'

function hasCronAccess(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get('secret') === CRON_PASSPHRASE
}

// Shared scoring logic — only markets that still have unscored predictions are processed,
// so repeated cron runs are cheap and never double-score.
async function runScoring() {
  const resolvedMarkets = await prisma.market.findMany({
    where: {
      status: 'RESOLVED',
      resolvedValue: { not: null },
      predictions: { some: { status: { in: ['ACTIVE', 'LOCKED'] } } },
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
      // resolvedValue is Boolean (true = YES, false = NO)
      const outcome = market.resolvedValue === true
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
}

export async function GET(req: NextRequest) {
  // Cron entry point — must present CRON_SECRET
  if (!hasCronAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Pass ?secret=CRON_SECRET (set CRON_SECRET env var first).' },
      { status: 403 }
    )
  }

  try {
    return await runScoring()
  } catch (error) {
    console.error('Scoring error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
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
    return await runScoring()
  } catch (error) {
    console.error('Scoring error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
