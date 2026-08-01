// src/app/about/page.tsx
// About page — shows landing page content to all users (including authenticated)

import { prisma } from '@/lib/prisma'
import { CATEGORIES } from '@/lib/categories'
import LandingPageContent from '../LandingPageContent'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  // No auth redirect — this page is accessible to everyone
  // Fetch live data for landing page
  const [userCount, marketCount, predictionCount, liveMarkets] = await Promise.all([
    prisma.user.count(),
    prisma.market.count({ where: { status: 'OPEN' } }),
    prisma.prediction.count(),
    prisma.market.findMany({
      where: { status: 'OPEN' },
      select: { id: true, title: true, category: true, marketProbability: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  // Format markets for ticker
  const tickerMarkets = liveMarkets.map(m => {
    const categoryDef = CATEGORIES.find(c => c.value === m.category)
    return {
      prob: m.marketProbability ? `${Math.round(m.marketProbability * 100)}%` : '50%',
      text: m.title.length > 60 ? m.title.substring(0, 60) + '...' : m.title,
      cat: categoryDef?.label || m.category,
    }
  })

  // Show landing page content to all visitors with live data
  return (
    <LandingPageContent
      userCount={userCount}
      marketCount={marketCount}
      predictionCount={predictionCount}
      tickerMarkets={tickerMarkets}
    />
  )
}
