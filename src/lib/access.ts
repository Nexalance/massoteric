// src/lib/access.ts
// Feature flag and access control logic
// Determines what each user tier can see/do

import { prisma } from '@/lib/prisma'
import { FeatureKey, SubscriptionTier } from '@prisma/client'

/**
 * Check if a feature is accessible by a given subscription tier.
 * Checks the database feature flag — admin can toggle at any time.
 * Admins can always access everything (pass isAdmin: true to bypass tier checks).
 */
export async function canAccess(
  tier: SubscriptionTier,
  feature: FeatureKey,
  isAdmin?: boolean
): Promise<boolean> {
  // Admins and PRO users can always access everything
  if (isAdmin || tier === 'PRO') return true

  const flag = await prisma.featureFlag.findUnique({
    where: { key: feature },
  })

  if (!flag || !flag.isEnabled) return false
  if (flag.isFree) return true  // available to all tiers

  // Standard tier gets most paid features
  if (tier === 'STANDARD') {
    return [
      FeatureKey.FULL_REASONING,
      FeatureKey.ACCURACY_FILTER,
      FeatureKey.USER_FILTER,
      FeatureKey.CATEGORY_LEADERBOARD,
      FeatureKey.TOPIC_CREATE,
    ].includes(feature)
  }

  return false
}

/**
 * Get all feature flags with access status for a given tier.
 * Used in the admin dashboard and settings page.
 */
export async function getAllFeatureAccess(tier: SubscriptionTier) {
  const flags = await prisma.featureFlag.findMany()

  return flags.map(flag => ({
    ...flag,
    hasAccess: tier === 'PRO' || (flag.isEnabled && (flag.isFree || tier === 'STANDARD')),
  }))
}

/**
 * Middleware helper: check if the current user can view full reasoning.
 * Used in API routes to strip/include reasoning in responses.
 * Admins can always view full reasoning.
 */
export function canViewFullReasoning(tier: SubscriptionTier, isFlagFree: boolean, isAdmin?: boolean): boolean {
  if (isAdmin || tier === 'PRO' || tier === 'STANDARD') return true
  return isFlagFree
}

/**
 * Get the tier label for display.
 */
export function getTierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'FREE': return 'Free'
    case 'STANDARD': return 'Standard'
    case 'PRO': return 'Pro'
  }
}

/**
 * Get the upgrade prompt for a locked feature.
 */
export function getUpgradePrompt(feature: FeatureKey): string {
  switch (feature) {
    case FeatureKey.FULL_REASONING:
      return 'Upgrade to read the complete reasoning behind every prediction.'
    case FeatureKey.ACCURACY_FILTER:
      return 'Upgrade to filter predictions by accuracy score.'
    case FeatureKey.USER_FILTER:
      return 'Upgrade to follow and filter specific forecasters.'
    case FeatureKey.CATEGORY_LEADERBOARD:
      return 'Upgrade to see leaderboards broken down by topic.'
    case FeatureKey.TOPIC_CREATE:
      return 'Upgrade to create your own prediction markets and share with the community.'
    case FeatureKey.EXPERT_QA:
      return 'Upgrade to ask experts questions directly.'
    default:
      return 'Upgrade to unlock this feature.'
  }
}
