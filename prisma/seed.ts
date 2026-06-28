// prisma/seed.ts
// Run with: npm run db:seed
// Seeds default feature flags and sample data for development

import { PrismaClient, FeatureKey, MarketSource, MarketCategory, MarketStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Feature Flags ──────────────────────────────────────
  const flags = [
    {
      key: FeatureKey.FULL_REASONING,
      label: 'Full Reasoning Text',
      description: 'Show complete prediction reasoning (vs. snippet only)',
      isFree: false,
    },
    {
      key: FeatureKey.ACCURACY_FILTER,
      label: 'Filter by Accuracy Score',
      description: 'Allow users to sort/filter predictions by accuracy',
      isFree: false,
    },
    {
      key: FeatureKey.USER_FILTER,
      label: 'Filter by Specific User',
      description: 'Allow users to filter predictions to specific people',
      isFree: false,
    },
    {
      key: FeatureKey.CATEGORY_LEADERBOARD,
      label: 'Category Leaderboards',
      description: 'Show leaderboards broken down by topic category',
      isFree: false,
    },
    {
      key: FeatureKey.EXPERT_QA,
      label: 'Expert Q&A',
      description: 'Allow subscribers to ask experts questions',
      isFree: false,
    },
    {
      key: FeatureKey.TOPIC_CREATE,
      label: 'Create New Topics',
      description: 'Allow users to submit new prediction topics',
      isFree: true,
    },
  ]

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    })
  }
  console.log('✅ Feature flags seeded')

  // ── Sample Markets (for development) ──────────────────
  const markets = [
    {
      source: MarketSource.POLYMARKET,
      category: MarketCategory.FINANCE,
      title: 'Will the Fed cut interest rates before September 2025?',
      description: 'This market resolves YES if the Federal Reserve announces a federal funds rate cut at any FOMC meeting scheduled before September 2025.',
      marketProbability: 0.62,
      closesAt: new Date('2025-08-31'),
      resolvesAt: new Date('2025-09-01'),
      status: MarketStatus.OPEN,
      externalUrl: 'https://polymarket.com',
      featured: true,
    },
    {
      source: MarketSource.POLYMARKET,
      category: MarketCategory.CRYPTO,
      title: 'Will Bitcoin exceed $120,000 by end of 2025?',
      description: 'Resolves YES if Bitcoin (BTC) price on any major exchange exceeds $120,000 USD at any point before December 31, 2025.',
      marketProbability: 0.44,
      closesAt: new Date('2025-12-31'),
      resolvesAt: new Date('2026-01-01'),
      status: MarketStatus.OPEN,
      externalUrl: 'https://polymarket.com',
      featured: true,
    },
    {
      source: MarketSource.KALSHI,
      category: MarketCategory.MACRO,
      title: 'Will US GDP growth exceed 2% in 2025?',
      description: 'Resolves YES if the Bureau of Economic Analysis reports full-year 2025 US real GDP growth above 2.0%.',
      marketProbability: 0.58,
      closesAt: new Date('2026-01-30'),
      resolvesAt: new Date('2026-02-01'),
      status: MarketStatus.OPEN,
      externalUrl: 'https://kalshi.com',
      featured: false,
    },
    {
      source: MarketSource.POLYMARKET,
      category: MarketCategory.TECH,
      title: 'Will Apple release AR glasses in 2025?',
      description: 'Resolves YES if Apple officially releases a consumer AR/mixed reality glasses product (distinct from Vision Pro) in 2025.',
      marketProbability: 0.21,
      closesAt: new Date('2025-12-31'),
      resolvesAt: new Date('2026-01-01'),
      status: MarketStatus.OPEN,
      externalUrl: 'https://polymarket.com',
      featured: false,
    },
  ]

  for (const market of markets) {
    await prisma.market.upsert({
      where: { externalId: market.title.slice(0, 40) },
      update: {},
      create: {
        ...market,
        externalId: market.title.slice(0, 40),
        tags: [],
      },
    })
  }
  console.log('✅ Sample markets seeded')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
