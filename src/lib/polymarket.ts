// src/lib/polymarket.ts
// Polymarket API integration
// Docs: https://docs.polymarket.com
// Public API — no authentication required for read access

import { MarketCategory, MarketStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.POLYMARKET_API_BASE || 'https://gamma-api.polymarket.com'

interface PolymarketEvent {
  id: string
  title: string
  description: string
  endDate: string
  active: boolean
  closed: boolean
  archived: boolean
  markets: PolymarketMarket[]
  tags: { label: string }[]
  image?: string
}

interface PolymarketMarket {
  id: string
  question: string
  description: string
  endDate: string
  outcomePrices: string  // JSON string e.g. '["0.62", "0.38"]'
  outcomes: string       // JSON string e.g. '["Yes", "No"]'
  active: boolean
  closed: boolean
  archived: boolean
  volume: string
  liquidity: string
}

/**
 * Fetch active markets from Polymarket API
 */
export async function fetchPolymarketEvents(limit = 50): Promise<PolymarketEvent[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      active: 'true',
      closed: 'false',
      archived: 'false',
      order: 'volume',
      ascending: 'false',
    })

    const res = await fetch(`${BASE_URL}/events?${params}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    })

    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Failed to fetch Polymarket events:', err)
    return []
  }
}

/**
 * Map Polymarket tag labels to our MarketCategory enum
 */
function mapCategory(tags: { label: string }[]): MarketCategory {
  const labels = tags.map(t => t.label.toLowerCase())

  if (labels.some(l => ['politics', 'election', 'government'].includes(l))) return 'POLITICS'
  if (labels.some(l => ['crypto', 'bitcoin', 'ethereum', 'defi'].includes(l))) return 'CRYPTO'
  if (labels.some(l => ['finance', 'stocks', 'fed', 'economy', 'markets'].includes(l))) return 'FINANCE'
  if (labels.some(l => ['sports', 'nfl', 'nba', 'soccer', 'football'].includes(l))) return 'SPORTS'
  if (labels.some(l => ['science', 'climate', 'health', 'medicine'].includes(l))) return 'SCIENCE'
  if (labels.some(l => ['tech', 'technology', 'ai', 'artificial intelligence'].includes(l))) return 'TECH'
  if (labels.some(l => ['macro', 'gdp', 'inflation', 'recession'].includes(l))) return 'MACRO'

  return 'OTHER'
}

/**
 * Sync Polymarket markets into our database.
 * Called on a schedule (e.g., every 5 minutes via a cron job or revalidation).
 */
export async function syncPolymarketMarkets(): Promise<{ synced: number; errors: number }> {
  const events = await fetchPolymarketEvents(100)
  let synced = 0
  let errors = 0

  for (const event of events) {
    try {
      // Each event may have multiple markets — we take the first (binary) one
      const market = event.markets?.[0]
      if (!market) continue

      let probability: number | null = null
      try {
        const prices = JSON.parse(market.outcomePrices)
        probability = parseFloat(prices[0]) // "Yes" price = probability
      } catch { /* ignore parse errors */ }

      const category = mapCategory(event.tags || [])

      await prisma.market.upsert({
        where: { externalId: event.id },
        update: {
          title: event.title || market.question,
          marketProbability: probability,
          status: event.closed || event.archived ? MarketStatus.CLOSED : MarketStatus.OPEN,
          updatedAt: new Date(),
        },
        create: {
          externalId: event.id,
          source: 'POLYMARKET',
          category,
          title: event.title || market.question,
          description: event.description || market.description,
          marketProbability: probability,
          imageUrl: event.image,
          closesAt: event.endDate ? new Date(event.endDate) : null,
          resolvesAt: event.endDate ? new Date(event.endDate) : null,
          status: MarketStatus.OPEN,
          externalUrl: `https://polymarket.com/event/${event.id}`,
          tags: event.tags?.map(t => t.label) || [],
        },
      })
      synced++
    } catch (err) {
      console.error(`Failed to sync market ${event.id}:`, err)
      errors++
    }
  }

  console.log(`Polymarket sync: ${synced} synced, ${errors} errors`)
  return { synced, errors }
}

/**
 * Check for resolved markets and trigger scoring.
 * Called periodically to catch resolutions.
 */
export async function checkMarketResolutions(): Promise<void> {
  // Markets that have passed their resolution date but aren't yet resolved
  const pendingResolution = await prisma.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      resolvesAt: { lte: new Date() },
      source: 'POLYMARKET',
    },
  })

  for (const market of pendingResolution) {
    if (!market.externalId) continue

    try {
      // Fetch current state from Polymarket
      const res = await fetch(`${BASE_URL}/events/${market.externalId}`)
      if (!res.ok) continue

      const event: PolymarketEvent = await res.json()

      if (event.archived || event.closed) {
        // Market is done — check if there's a winner
        const polyMarket = event.markets?.[0]
        if (!polyMarket) continue

        let resolvedValue: boolean | null = null
        try {
          const prices = JSON.parse(polyMarket.outcomePrices)
          // If YES price is ~1.0, it resolved YES; if ~0.0, it resolved NO
          const yesPrice = parseFloat(prices[0])
          if (yesPrice > 0.95) resolvedValue = true
          else if (yesPrice < 0.05) resolvedValue = false
        } catch { /* can't determine outcome */ }

        if (resolvedValue !== null) {
          // Update market as resolved
          await prisma.market.update({
            where: { id: market.id },
            data: {
              status: MarketStatus.RESOLVED,
              resolvedAt: new Date(),
              resolvedValue,
            },
          })

          // Trigger scoring
          const { scoreMarket } = await import('@/lib/scoring')
          await scoreMarket(market.id, resolvedValue)
        }
      }
    } catch (err) {
      console.error(`Failed to check resolution for market ${market.id}:`, err)
    }
  }
}
