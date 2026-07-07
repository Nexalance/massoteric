// src/lib/init-feature-flags.ts
// Ensures feature flags exist in the database
// Run this on app startup or first API call

import { prisma } from '@/lib/prisma'
import { FeatureKey } from '@prisma/client'

export async function ensureFeatureFlags() {
  const flags = [
    {
      key: FeatureKey.FULL_REASONING,
      label: 'Full Reasoning Text',
      description: 'Show complete prediction reasoning (vs. snippet only)',
      isFree: false,
      isEnabled: true,
    },
    {
      key: FeatureKey.ACCURACY_FILTER,
      label: 'Filter by Accuracy Score',
      description: 'Allow users to sort/filter predictions by accuracy',
      isFree: false,
      isEnabled: true,
    },
    {
      key: FeatureKey.USER_FILTER,
      label: 'Filter by Specific User',
      description: 'Allow users to filter predictions to specific people',
      isFree: false,
      isEnabled: true,
    },
    {
      key: FeatureKey.CATEGORY_LEADERBOARD,
      label: 'Category Leaderboards',
      description: 'Show leaderboards broken down by topic category',
      isFree: false,
      isEnabled: true,
    },
    {
      key: FeatureKey.EXPERT_QA,
      label: 'Expert Q&A',
      description: 'Allow subscribers to ask experts questions',
      isFree: false,
      isEnabled: true,
    },
    {
      key: FeatureKey.TOPIC_CREATE,
      label: 'Create New Topics',
      description: 'Allow users to submit new prediction topics',
      isFree: false,
      isEnabled: true,
    },
  ]

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: {
        isEnabled: flag.isEnabled,
        isFree: flag.isFree,
      },
    })
  }

  console.log('✅ Feature flags initialized')
}
