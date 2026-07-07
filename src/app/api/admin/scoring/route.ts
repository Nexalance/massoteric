import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { calculateBrierScore } from '@/lib/scoring'

async function requireAdmin(clerkId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim())
  if (!adminIds.includes(clerkId)) throw new Error('Forbidden')
}

/**
 * POST /api/admin/scoring/rebuild-market
 * Rebuild accuracy scores for a specific market
 * Use this when scoring failed or AccuracyScore rows are missing
 */
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try { await requireAdmin(clerkId) }
  catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }

  const body = await req.json()
  const marketId = body.marketId

  if (!marketId) {
    return NextResponse.json({ error: 'marketId required' }, { status: 400 })
  }

  try {
    // Fetch the market
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: { id: true, resolvedValue: true, status: true }
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    if (market.status !== 'RESOLVED' || market.resolvedValue === null) {
      return NextResponse.json({ error: 'Market must be resolved with an outcome' }, { status: 400 })
    }

    // Get all predictions for this market
    const predictions = await prisma.prediction.findMany({
      where: { marketId },
      include: { user: true, market: true },
    })

    if (predictions.length === 0) {
      return NextResponse.json({ message: 'No predictions found for this market' })
    }

    const outcome = market.resolvedValue

    // Get unique users from these predictions
    const userIds = [...new Set(predictions.map(p => p.userId))]

    // Re-score each prediction and ensure it's marked as SCORED
    for (const prediction of predictions) {
      const brierScore = calculateBrierScore(prediction.probability, outcome)
      const isCorrect = outcome ? prediction.probability >= 0.5 : prediction.probability < 0.5

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          brierScore,
          isCorrect,
          status: 'SCORED',
        },
      })
    }

    // Now rebuild accuracy scores for each affected user
    let totalUsersUpdated = 0

    for (const userId of userIds) {
      // Get all scored predictions for this user
      const userPredictions = await prisma.prediction.findMany({
        where: {
          userId,
          status: 'SCORED',
          brierScore: { not: null }
        },
        include: { market: true }
      })

      if (userPredictions.length === 0) continue

      // Calculate overall score
      const totalBrier = userPredictions.reduce((sum, p) => sum + p.brierScore!, 0)
      const avgBrier = totalBrier / userPredictions.length
      const accuracyPct = Math.round((1 - avgBrier) * 100)

      // For overall score (category: null), use findFirst + create/update
      // because @@unique([userId, category]) doesn't work with null values
      const existingOverall = await prisma.accuracyScore.findFirst({
        where: { userId, category: null }
      })

      if (existingOverall) {
        await prisma.accuracyScore.update({
          where: { id: existingOverall.id },
          data: {
            totalPredictions: userPredictions.length,
            scoredPredictions: userPredictions.length,
            totalBrierScore: totalBrier,
            avgBrierScore: avgBrier,
            accuracyPct
          }
        })
      } else {
        await prisma.accuracyScore.create({
          data: {
            userId,
            category: null,
            totalPredictions: userPredictions.length,
            scoredPredictions: userPredictions.length,
            totalBrierScore: totalBrier,
            avgBrierScore: avgBrier,
            accuracyPct
          }
        })
      }

      // Calculate category-specific scores
      const categories = [...new Set(userPredictions.map(p => p.market.category).filter(Boolean))]
      for (const cat of categories) {
        const catPredictions = userPredictions.filter(p => p.market.category === cat)
        const catTotalBrier = catPredictions.reduce((sum, p) => sum + p.brierScore!, 0)
        const catAvgBrier = catTotalBrier / catPredictions.length
        const catAccuracyPct = Math.round((1 - catAvgBrier) * 100)

        await prisma.accuracyScore.upsert({
          where: {
            userId_category: { userId, category: cat }
          },
          create: {
            userId,
            category: cat,
            totalPredictions: catPredictions.length,
            scoredPredictions: catPredictions.length,
            totalBrierScore: catTotalBrier,
            avgBrierScore: catAvgBrier,
            accuracyPct: catAccuracyPct
          },
          update: {
            totalPredictions: catPredictions.length,
            scoredPredictions: catPredictions.length,
            totalBrierScore: catTotalBrier,
            avgBrierScore: catAvgBrier,
            accuracyPct: catAccuracyPct
          }
        })
      }

      totalUsersUpdated++
    }

    return NextResponse.json({
      success: true,
      message: `Rebuilt scoring for ${predictions.length} predictions across ${totalUsersUpdated} users`,
      market: {
        id: market.id,
        resolvedValue: outcome,
      },
      predictionsRebuilt: predictions.length,
      usersUpdated: totalUsersUpdated
    })
  } catch (error) {
    console.error('Failed to rebuild scoring:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rebuild scoring' },
      { status: 500 }
    )
  }
}
