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
  const [userCount, marketCount, predictionCount] = await Promise.all([
    prisma.user.count(),
    prisma.market.count({ where: { status: 'OPEN' } }),
    prisma.prediction.count(),
  ])

  // Ticker: prefer longer-duration, higher-interest markets. Plain
  // order-by-createdAt lets Polymarket's constantly-minted 5-minute crypto
  // micro-windows dominate, so rank markets that stay open at least 3 more
  // days and fall back to newest-first only if there aren't enough.
  // Honours the yes/no-only display flag like the feed does.
  const binaryOnlyFlag = await prisma.featureFlag.findUnique({
    where: { key: 'SIMPLE_BINARY_ONLY' },
    select: { isEnabled: true },
  })
  const binaryOnly = binaryOnlyFlag ? binaryOnlyFlag.isEnabled : true
  const tickerSelect = { id: true, title: true, category: true, marketProbability: true } as const
  const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const longHorizonMarkets = await prisma.market.findMany({
    where: { status: 'OPEN', closesAt: { gte: threeDaysOut }, ...(binaryOnly && { isBinary: true }) },
    select: tickerSelect,
    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
    take: 8,
  })
  let liveMarkets = longHorizonMarkets
  if (liveMarkets.length < 8) {
    const fill = await prisma.market.findMany({
      where: { status: 'OPEN', id: { notIn: longHorizonMarkets.map(m => m.id) }, ...(binaryOnly && { isBinary: true }) },
      select: tickerSelect,
      orderBy: { createdAt: 'desc' },
      take: 8 - longHorizonMarkets.length,
    })
    liveMarkets = [...longHorizonMarkets, ...fill]
  }

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
