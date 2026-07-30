// src/app/page.tsx
// Landing page server component — auth-aware routing

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-mock'
import { prisma } from '@/lib/prisma'
import { CATEGORIES } from '@/lib/categories'
import LandingPageContent from './LandingPageContent'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await auth()

  // If user is authenticated, redirect to feed immediately
  // (Landing page is for first-time/anonymous visitors only)
  if (user?.userId) {
    redirect('/feed')
  }

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

  // Show landing page to anonymous visitors with live data
  return (
    <LandingPageContent
      userCount={userCount}
      marketCount={marketCount}
      predictionCount={predictionCount}
      tickerMarkets={tickerMarkets}
    />
  )
}
