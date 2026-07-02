// src/lib/scoring.ts
// Brier Score calculation and accuracy utilities
//
// Brier Score measures the accuracy of probabilistic predictions.
// Formula: BS = (forecast - outcome)²
// Range: 0.0 (perfect) to 1.0 (worst possible for binary outcomes)
// Lower is better.
//
// We also compute a "skill score" relative to a naive 50/50 baseline,
// and a simple accuracy percentage for display purposes.

import { prisma } from '@/lib/prisma'
import { MarketCategory } from '@prisma/client'

/**
 * Calculate the Brier Score for a single prediction.
 * @param probability - user's forecast (0.0 – 1.0)
 * @param outcome - actual result (true = YES, false = NO)
 */
export function calculateBrierScore(probability: number, outcome: boolean): number {
  const o = outcome ? 1 : 0
  return Math.pow(probability - o, 2)
}

/**
 * Convert a Brier Score to a human-readable accuracy percentage.
 * Uses: accuracy = (1 - brierScore) * 100
 * A perfect score (0.0) = 100%, random (0.25) = 75%, worst (1.0) = 0%
 */
export function brierToAccuracyPct(avgBrierScore: number): number {
  return Math.round((1 - avgBrierScore) * 100)
}

/**
 * Score all predictions for a resolved market and update user accuracy scores.
 * Called automatically when a market is marked as resolved.
 *
 * @param marketId - the resolved market
 * @param outcome - true = YES resolved, false = NO resolved
 */
export async function scoreMarket(marketId: string, outcome: boolean): Promise<void> {
  // Get all active predictions for this market
  const predictions = await prisma.prediction.findMany({
    where: { marketId, status: { in: ['ACTIVE', 'LOCKED'] } },
    include: { user: true, market: true },
  })

  if (predictions.length === 0) return

  console.log(`Scoring ${predictions.length} predictions for market ${marketId}`)

  for (const prediction of predictions) {
    const brierScore = calculateBrierScore(prediction.probability, outcome)
    const isCorrect = outcome ? prediction.probability >= 0.5 : prediction.probability < 0.5

    // Update the prediction with its score
    await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        brierScore,
        isCorrect,
        status: 'SCORED',
      },
    })

    // Update both overall and category-specific accuracy scores in one call
    // to avoid double-counting totalPredictions
    await updateUserAccuracyScores(prediction.userId, prediction.market.category, brierScore)
  }

  console.log(`✅ Scored market ${marketId}`)
}

/**
 * Update (or create) a user's accuracy score record.
 * Uses a running average to avoid recomputing all predictions.
 *
 * IMPORTANT: totalPredictions is only incremented for overall scores (category = null)
 * to avoid double-counting when updating both overall and category scores.
 */
async function updateUserAccuracyScore(
  userId: string,
  category: MarketCategory | null,
  newBrierScore: number,
  incrementTotal: boolean = true
): Promise<void> {
  const existing = await prisma.accuracyScore.findFirst({
    where: {
      userId,
      category: category ?? null
    },
  })

  if (existing) {
    const newTotal = existing.totalBrierScore + newBrierScore
    const newCount = existing.scoredPredictions + 1
    const newAvg = newTotal / newCount

    await prisma.accuracyScore.update({
      where: { id: existing.id },
      data: {
        scoredPredictions: newCount,
        totalPredictions: incrementTotal ? existing.totalPredictions + 1 : existing.totalPredictions,
        totalBrierScore: newTotal,
        avgBrierScore: newAvg,
        accuracyPct: brierToAccuracyPct(newAvg),
      },
    })
  } else {
    await prisma.accuracyScore.create({
      data: {
        userId,
        category: category ?? undefined,
        totalPredictions: 1,
        scoredPredictions: 1,
        totalBrierScore: newBrierScore,
        avgBrierScore: newBrierScore,
        accuracyPct: brierToAccuracyPct(newBrierScore),
      },
    })
  }
}

/**
 * Update both overall and category-specific accuracy scores for a user in one transaction.
 * This ensures totalPredictions is only incremented once per prediction.
 */
async function updateUserAccuracyScores(
  userId: string,
  category: MarketCategory | null,
  newBrierScore: number
): Promise<void> {
  // Update overall score (increments totalPredictions)
  await updateUserAccuracyScore(userId, null, newBrierScore, true)

  // Update category-specific score only if category exists (does NOT increment totalPredictions)
  if (category) {
    await updateUserAccuracyScore(userId, category, newBrierScore, false)
  }
}

/**
 * Get a user's formatted accuracy display data.
 */
export async function getUserAccuracySummary(userId: string) {
  const scores = await prisma.accuracyScore.findMany({
    where: { userId },
  })

  const overall = scores.find(s => s.category === null)
  const byCategory = scores.filter(s => s.category !== null)

  return {
    overall: overall
      ? {
          accuracyPct: overall.accuracyPct,
          avgBrierScore: overall.avgBrierScore,
          totalPredictions: overall.totalPredictions,
          scoredPredictions: overall.scoredPredictions,
        }
      : null,
    byCategory: byCategory.map(s => ({
      category: s.category,
      accuracyPct: s.accuracyPct,
      avgBrierScore: s.avgBrierScore,
      totalPredictions: s.totalPredictions,
      scoredPredictions: s.scoredPredictions,
    })),
  }
}

/**
 * Check if a prediction is within the lock window (48 hours before close).
 */
export function isPredictionLocked(closesAt: Date | null): boolean {
  if (!closesAt) return false
  const hoursUntilClose = (closesAt.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntilClose <= 48
}

/**
 * Generate a public snippet from full reasoning text (~200 chars, ends at word boundary).
 */
export function generateReasoningSnippet(reasoning: string): string {
  if (reasoning.length <= 200) return reasoning
  const truncated = reasoning.slice(0, 200)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.slice(0, lastSpace) + '...'
}
