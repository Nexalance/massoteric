// src/app/api/cron/scoring/route.ts
// PUBLIC cron endpoint — no Clerk auth, only the ?secret=ploySecret passphrase.
// External scheduler (Dokploy cron) hits this with a plain GET.
// Admin UI button continues to use POST /api/admin/scoring (Clerk session).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreMarket } from '@/lib/scoring'

// Allow up to 5 minutes on Vercel Pro — scoring loops over markets with pending predictions
export const maxDuration = 300

// Fixed public passphrase — cron server just appends ?secret=ploySecret
const CRON_PASSPHRASE = 'ploySecret'

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
  if (req.nextUrl.searchParams.get('secret') !== CRON_PASSPHRASE) {
    return NextResponse.json(
      { success: false, error: 'Forbidden. Append ?secret=ploySecret' },
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
