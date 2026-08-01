// src/lib/polymarket.ts
// Polymarket API integration
// Docs: https://docs.polymarket.com
// Public API — no authentication required for read access

import { MarketCategory, MarketStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { mapTagsToSubcategory } from '@/lib/subcategories'

const BASE_URL = process.env.POLYMARKET_API_BASE || 'https://gamma-api.polymarket.com'

interface PolymarketTag {
  id: string
  label: string
  slug: string
  forceShow?: boolean
  forceHide?: boolean
  isCarousel?: boolean
}

interface PolymarketEvent {
  id: string
  title: string
  description: string
  endDate: string
  active: boolean
  closed: boolean
  archived: boolean
  markets: PolymarketMarket[]
  tags: { label: string; slug?: string; id?: string }[]
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
 * Fetch active markets from Polymarket API with pagination
 * The API has a hard limit of 100 per request, so we paginate to fetch all events
 * Includes retry logic with exponential backoff for resilience
 */
export async function fetchPolymarketEvents(maxLimit = 5000): Promise<PolymarketEvent[]> {
  return fetchPolymarketEventsByTag(undefined, maxLimit)
}

/**
 * Fetch events filtered by a specific tag slug (e.g., 'iran' for Iran markets)
 * This allows fetching all events for a category that might not appear in the top 5000 by volume
 * Used for categories like IRAN that have many lower-volume events
 */
export async function fetchPolymarketEventsByTag(tagSlug: string | undefined, maxLimit = 5000): Promise<PolymarketEvent[]> {
  const PAGE_SIZE = 100 // API hard limit per request
  let allEvents: PolymarketEvent[] = []
  let offset = 0
  let hasMore = true
  let retryCount = 0
  const MAX_RETRIES = 3

  while (hasMore && allEvents.length < maxLimit) {
    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: offset.toString(),
        active: 'true',
        closed: 'false',
        archived: 'false',
        order: 'volume',
        ascending: 'false',
      })

      // Add tag filter if specified
      if (tagSlug) {
        params.append('tag_slug', tagSlug)
      }

      const res = await fetch(`${BASE_URL}/events?${params}`, {
        next: { revalidate: 300 }, // cache for 5 minutes
      })

      if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)

      const events: PolymarketEvent[] = await res.json()

      if (events.length === 0) {
        hasMore = false
      } else {
        allEvents = allEvents.concat(events)
        offset += PAGE_SIZE
        retryCount = 0 // Reset retry count on success

        // If we got fewer events than PAGE_SIZE, we've reached the end
        if (events.length < PAGE_SIZE) {
          hasMore = false
        }
      }
    } catch (err) {
      retryCount++
      console.error(`[Polymarket] Fetch failed (attempt ${retryCount}/${MAX_RETRIES}):`, err)

      if (retryCount >= MAX_RETRIES) {
        console.error('[Polymarket] Max retries reached, aborting pagination')
        break
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffDelay = 1000 * Math.pow(2, retryCount - 1)
      console.log(`[Polymarket] Retrying after ${backoffDelay}ms backoff...`)
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
    }
  }

  const tagInfo = tagSlug ? ` for tag "${tagSlug}"` : ''
  console.log(`[Polymarket] Fetched ${allEvents.length} events${tagInfo} (paginated, max limit: ${maxLimit})`)
  return allEvents
}

/**
 * Fetch all tags from Polymarket API with pagination
 * Returns the complete list of tags available on Polymarket
 */
export async function fetchPolymarketTags(maxLimit = 10000): Promise<PolymarketTag[]> {
  const PAGE_SIZE = 100
  let allTags: PolymarketTag[] = []
  let offset = 0
  let hasMore = true

  while (hasMore && allTags.length < maxLimit) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      offset: offset.toString(),
    })

    try {
      const res = await fetch(`${BASE_URL}/tags?${params}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!res.ok) throw new Error(`Polymarket tags API error: ${res.status}`)

      const tags: PolymarketTag[] = await res.json()

      if (tags.length === 0) {
        hasMore = false
      } else {
        allTags = allTags.concat(tags)
        offset += PAGE_SIZE

        if (tags.length < PAGE_SIZE) {
          hasMore = false
        }
      }
    } catch (err) {
      console.error(`[Polymarket] Failed to fetch tags at offset ${offset}:`, err)
      hasMore = false
    }
  }

  console.log(`[Polymarket] Fetched ${allTags.length} tags`)
  return allTags
}

/**
 * Polymarket's curated navigation subcategories per category
 * These are the only subcategories shown in Polymarket's UI
 */
const POLYMARKET_CURATED_SUBCATEGORIES: Record<string, Array<{ slug: string; label: string; order: number }>> = {
  POLITICS: [
    { slug: 'trump', label: 'Trump', order: 1 },
    { slug: 'trump-daily', label: 'Trump Daily', order: 2 },
    { slug: 'midterms', label: 'Midterms', order: 3 },
    { slug: 'global-elections', label: 'Global Elections', order: 4 },
    { slug: 'primaries', label: 'Primaries', order: 5 },
    { slug: 'congress', label: 'Congress', order: 6 },
    { slug: 'trump-cabinet', label: 'Trump Cabinet', order: 7 },
    { slug: 'courts', label: 'Courts', order: 8 },
    { slug: 'epstein', label: 'Epstein', order: 9 },
    { slug: 'gov-shutdown', label: 'Gov Shutdown', order: 10 },
    { slug: 'la-mayor', label: 'LA Mayor', order: 11 },
    { slug: 'uk-elections', label: 'UK Elections', order: 12 },
    { slug: 'german-elections', label: 'German Elections', order: 13 },
    { slug: 'french-elections', label: 'French Elections', order: 14 },
    { slug: 'us-presidential-election', label: 'US Election', order: 15 },
    { slug: 'mayoral-elections', label: 'Mayoral Elections', order: 16 },
    { slug: 'south-korea', label: 'South Korea', order: 17 },
    { slug: 'japan', label: 'Japan', order: 18 },
    { slug: 'china', label: 'China', order: 19 },
    { slug: 'brazil', label: 'Brazil', order: 20 },
    { slug: 'canada', label: 'Canada', order: 21 },
    { slug: 'venezuela', label: 'Venezuela', order: 22 },
    { slug: 'turkey', label: 'Turkey', order: 23 },
  ],
  FINANCE: [
    { slug: 'stocks', label: 'Stocks', order: 1 },
    { slug: 'earnings', label: 'Earnings', order: 2 },
    { slug: 'indices', label: 'Indices', order: 3 },
    { slug: 'commodities', label: 'Commodities', order: 4 },
    { slug: 'forex', label: 'Forex', order: 5 },
    { slug: 'privates', label: 'Privates', order: 6 },
    { slug: 'acquisitions', label: 'Acquisitions', order: 7 },
    { slug: 'earnings-calendar', label: 'Earnings Calendar', order: 8 },
    { slug: 'ipos', label: 'IPOs', order: 9 },
    { slug: 'fed-rates', label: 'Fed Rates', order: 10 },
    { slug: 'prediction-markets', label: 'Prediction Markets', order: 11 },
    { slug: 'treasuries', label: 'Treasuries', order: 12 },
    { slug: 'kpis', label: 'KPIs', order: 13 },
  ],
  CRYPTO: [
    { slug: 'bitcoin', label: 'Bitcoin', order: 1 },
    { slug: 'ethereum', label: 'Ethereum', order: 2 },
    { slug: 'solana', label: 'Solana', order: 3 },
    { slug: 'xrp', label: 'XRP', order: 4 },
    { slug: 'dogecoin', label: 'Dogecoin', order: 5 },
    { slug: 'bnb', label: 'BNB', order: 6 },
    { slug: 'microstrategy', label: 'MicroStrategy', order: 7 },
  ],
  SPORTS: [
    { slug: 'mlb', label: 'MLB', order: 1 },
    { slug: 'ufc', label: 'UFC', order: 2 },
    { slug: 'soccer', label: 'Soccer', order: 3 },
    { slug: 'tennis', label: 'Tennis', order: 4 },
    { slug: 'cricket', label: 'Cricket', order: 5 },
    { slug: 'basketball', label: 'Basketball', order: 6 },
    { slug: 'baseball', label: 'Baseball', order: 7 },
    { slug: 'football', label: 'Football', order: 8 },
    { slug: 'hockey', label: 'Hockey', order: 9 },
    { slug: 'rugby', label: 'Rugby', order: 10 },
    { slug: 'table-tennis', label: 'Table Tennis', order: 11 },
    { slug: 'volleyball', label: 'Volleyball', order: 12 },
    { slug: 'golf', label: 'Golf', order: 13 },
    { slug: 'combat', label: 'Combat', order: 14 },
    { slug: 'motorsports', label: 'Motorsports', order: 15 },
    { slug: 'cycling', label: 'Cycling', order: 16 },
    { slug: 'poker', label: 'Poker', order: 17 },
    { slug: 'chess', label: 'Chess', order: 18 },
    { slug: 'pickleball', label: 'Pickleball', order: 19 },
    { slug: 'lacrosse', label: 'Lacrosse', order: 20 },
    { slug: 'esports', label: 'Esports', order: 21 },
  ],
  TECH: [
    { slug: 'ai', label: 'AI', order: 1 },
    { slug: 'elon-musk', label: 'Elon Musk', order: 2 },
    { slug: 'app-store', label: 'App Store', order: 3 },
    { slug: 'spacex', label: 'SpaceX', order: 4 },
    { slug: 'apple', label: 'Apple', order: 5 },
    { slug: 'science', label: 'Science', order: 6 },
    { slug: 'openai', label: 'OpenAI', order: 7 },
    { slug: 'microstrategy', label: 'MicroStrategy', order: 8 },
    { slug: 'big-tech', label: 'Big Tech', order: 9 },
    { slug: 'tiktok', label: 'TikTok', order: 10 },
    { slug: 'prediction-markets', label: 'Prediction Markets', order: 11 },
  ],
  SCIENCE: [
    { slug: 'hurricanes', label: 'Hurricanes', order: 1 },
    { slug: 'global-temp', label: 'Global Temp', order: 2 },
    { slug: 'weather', label: 'Weather', order: 3 },
    { slug: 'ai', label: 'AI', order: 4 },
    { slug: 'spacex', label: 'SpaceX', order: 5 },
    { slug: 'pandemics', label: 'Pandemics', order: 6 },
  ],
  ECONOMY: [
    { slug: 'trade-war', label: 'Trade War', order: 1 },
    { slug: 'fed-rates', label: 'Fed Rates', order: 2 },
    { slug: 'inflation', label: 'Inflation', order: 3 },
    { slug: 'macro-indicators', label: 'Macro Indicators', order: 4 },
    { slug: 'gdp', label: 'GDP', order: 5 },
    { slug: 'global-rates', label: 'Global Rates', order: 6 },
    { slug: 'taxes', label: 'Taxes', order: 7 },
    { slug: 'treasuries', label: 'Treasuries', order: 8 },
    { slug: 'consumer', label: 'Consumer', order: 9 },
    { slug: 'housing', label: 'Housing', order: 10 },
    { slug: 'labor', label: 'Labor', order: 11 },
  ],
  IRAN: [
    { slug: 'iran-ceasefire', label: 'Iran Ceasefire', order: 1 },
    { slug: 'us-iran', label: 'U.S. x Iran', order: 2 },
    { slug: 'strait-of-hormuz', label: 'Strait of Hormuz', order: 3 },
    { slug: 'peace-deal', label: 'Peace Deal', order: 4 },
    { slug: 'negotiation-topics', label: 'Negotiation Topics', order: 5 },
    { slug: 'oil', label: 'Oil', order: 6 },
    { slug: 'israel-iran', label: 'Israel x Iran', order: 7 },
    { slug: 'lebanon', label: 'Lebanon', order: 8 },
    { slug: 'iran-regime', label: 'Iran Regime', order: 9 },
    { slug: 'nuclear', label: 'Nuclear', order: 10 },
  ],
  GEOPOLITICS: [
    { slug: 'iran', label: 'Iran', order: 1 },
    { slug: 'lebanon', label: 'Lebanon', order: 2 },
    { slug: 'oil', label: 'Oil', order: 3 },
    { slug: 'ukraine', label: 'Ukraine', order: 4 },
    { slug: 'ukraine-map', label: 'Ukraine Map', order: 5 },
    { slug: 'cuba', label: 'Cuba', order: 6 },
    { slug: 'venezuela', label: 'Venezuela', order: 7 },
    { slug: 'middle-east', label: 'Middle East', order: 8 },
    { slug: 'gaza', label: 'Gaza', order: 9 },
    { slug: 'israel', label: 'Israel', order: 10 },
    { slug: 'syria', label: 'Syria', order: 11 },
    { slug: 'yemen', label: 'Yemen', order: 12 },
    { slug: 'turkey', label: 'Turkey', order: 13 },
    { slug: 'sudan', label: 'Sudan', order: 14 },
    { slug: 'china', label: 'China', order: 15 },
    { slug: 'india-pakistan', label: 'India-Pakistan', order: 16 },
  ],
  CULTURE: [
    { slug: 'art', label: 'Art', order: 1 },
    { slug: 'music', label: 'Music', order: 2 },
    { slug: 'celebrities', label: 'Celebrities', order: 3 },
    { slug: 'awards', label: 'Awards', order: 4 },
    { slug: 'mrbeast', label: 'MrBeast', order: 5 },
    { slug: 'movies', label: 'Movies', order: 6 },
    { slug: 'taylor-swift', label: 'Taylor Swift', order: 7 },
    { slug: 'gta-vi', label: 'GTA VI', order: 8 },
    { slug: 'tweet-markets', label: 'Tweet Markets', order: 9 },
    { slug: 'youtube', label: 'YouTube', order: 10 },
    { slug: 'reality-tv', label: 'Reality TV', order: 11 },
    { slug: 'aliens', label: 'Aliens', order: 12 },
    { slug: 'courts', label: 'Courts', order: 13 },
    { slug: 'eurovision', label: 'Eurovision', order: 14 },
  ],
  WEATHER: [
    { slug: 'temperature', label: 'Temperature', order: 1 },
    { slug: 'precipitation', label: 'Precipitation', order: 2 },
    { slug: 'global', label: 'Global', order: 3 },
  ],
  ELECTIONS: [
    { slug: 'australia', label: 'Australia', order: 1 },
    { slug: 'brazil', label: 'Brazil', order: 2 },
    { slug: 'canada', label: 'Canada', order: 3 },
    { slug: 'france', label: 'France', order: 4 },
    { slug: 'germany', label: 'Germany', order: 5 },
    { slug: 'india', label: 'India', order: 6 },
    { slug: 'israel', label: 'Israel', order: 7 },
    { slug: 'mexico', label: 'Mexico', order: 8 },
    { slug: 'new-zealand', label: 'New Zealand', order: 9 },
    { slug: 'philippines', label: 'Philippines', order: 10 },
    { slug: 'south-africa', label: 'South Africa', order: 11 },
    { slug: 'uk', label: 'United Kingdom', order: 12 },
    { slug: 'us', label: 'United States', order: 13 },
  ],
}

/**
 * Sync Polymarket's curated subcategories into our Subcategory table
 * Only syncs the subcategories that Polymarket shows in their navigation
 * Removes any subcategories that are not in the curated list
 */
export async function syncPolymarketSubcategories(): Promise<{ created: number; updated: number; deleted: number }> {
  let created = 0
  let updated = 0
  let deleted = 0

  // Collect all curated (slug, category) pairs - using composite key
  const curatedPairs = new Set<string>()
  for (const [category, subcategories] of Object.entries(POLYMARKET_CURATED_SUBCATEGORIES)) {
    for (const subcat of subcategories) {
      curatedPairs.add(`${subcat.slug}:${category}`)
    }
  }

  // Sync curated subcategories for each category
  for (const [category, subcategories] of Object.entries(POLYMARKET_CURATED_SUBCATEGORIES)) {
    for (const subcat of subcategories) {
      try {
        await prisma.subcategory.upsert({
          where: { slug_category: { slug: subcat.slug, category: category as MarketCategory } },
          update: {
            label: subcat.label,
            description: `${subcat.label} markets from Polymarket`,
            order: subcat.order,
            updatedAt: new Date(),
          },
          create: {
            slug: subcat.slug,
            label: subcat.label,
            category: category as MarketCategory,
            description: `${subcat.label} markets from Polymarket`,
            order: subcat.order,
          },
        })
        created++
      } catch (err) {
        console.error(`[Polymarket] Failed to sync subcategory ${subcat.slug}/${category}:`, err)
      }
    }
  }

  // Delete subcategories that are not in the curated list
  // We need to check both slug AND category since same slug can exist in different categories
  const allSubcategories = await prisma.subcategory.findMany({
    select: { id: true, slug: true, category: true, label: true },
  })

  const toDelete = allSubcategories.filter(s => !curatedPairs.has(`${s.slug}:${s.category}`))

  if (toDelete.length > 0) {
    // First, unset subcategoryId on markets that reference these subcategories
    await prisma.market.updateMany({
      where: {
        subcategoryId: { in: toDelete.map(s => s.id) },
      },
      data: { subcategoryId: null },
    })

    // Then delete the subcategories
    const deleteResult = await prisma.subcategory.deleteMany({
      where: {
        id: { in: toDelete.map(s => s.id) },
      },
    })
    deleted = deleteResult.count
    console.log(`[Polymarket] Deleted ${deleted} non-curated subcategories:`, toDelete.map(s => `${s.slug}/${s.category}`).slice(0, 10))
  }

  console.log(`[Polymarket] Synced ${created} curated subcategories, deleted ${deleted} non-curated`)
  return { created, updated, deleted }
}

/**
 * Map Polymarket tag labels to our MarketCategory enum
 * Uses substring matching to capture tags like "US Politics 2025-2029"
 */
function mapCategory(tags: { label: string }[]): MarketCategory {
  const labels = tags.map(t => t.label.toLowerCase())

  // IRAN - check first (most specific)
  if (labels.some(l => l.includes('iran') || l.includes('iranian') || l.includes('tehran'))) return 'IRAN'

  // POLITICS - substring match (catches "US Politics", "Politics 2025", etc.)
  if (labels.some(l => l.includes('politics') || l.includes('election') || l.includes('government'))) return 'POLITICS'

  // CRYPTO - substring match
  if (labels.some(l => l.includes('crypto') || l.includes('bitcoin') || l.includes('ethereum') || l.includes('defi'))) return 'CRYPTO'

  // FINANCE - substring match
  if (labels.some(l => l.includes('finance') || l.includes('stocks') || l.includes('fed') || l.includes('economy') || l.includes('markets'))) return 'FINANCE'

  // SPORTS - substring match
  if (labels.some(l => l.includes('sports') || l.includes('nfl') || l.includes('nba') || l.includes('soccer') || l.includes('football'))) return 'SPORTS'

  // GEOPOLITICS - substring match (war, conflicts, international relations)
  if (labels.some(l => l.includes('geopol') || l.includes('war') || l.includes('conflict') ||
      l.includes('israel') || l.includes('palestine') || l.includes('hamas') ||
      l.includes('ukraine') || l.includes('russia') || l.includes('invasion'))) return 'GEOPOLITICS'

  // CULTURE - substring match
  if (labels.some(l => l.includes('celebrit') || l.includes('music') || l.includes('movie') ||
      l.includes('award') || l.includes('entertainment') || l.includes('art') ||
      l.includes('youtube') || l.includes('twitter') || l.includes('tiktok'))) return 'CULTURE'

  // WEATHER - substring match
  if (labels.some(l => l.includes('weather') || l.includes('temperature') ||
      l.includes('hurricane') || l.includes('precipitation') || l.includes('tornado'))) return 'WEATHER'

  // ELECTIONS - substring match (global elections)
  if (labels.some(l => (l.includes('election') || l.includes('vote')) &&
      !l.includes('us') && !l.includes('american'))) return 'ELECTIONS'

  // SCIENCE - substring match
  if (labels.some(l => l.includes('science') || l.includes('climate') || l.includes('health') || l.includes('medicine'))) return 'SCIENCE'

  // TECH - substring match
  if (labels.some(l => l.includes('tech') || l.includes('technology') || l.includes('ai'))) return 'TECH'

  // ECONOMY - substring match
  if (labels.some(l => l.includes('macro') || l.includes('gdp') || l.includes('inflation') || l.includes('recession'))) return 'ECONOMY'

  return 'OTHER'
}

/**
 * Sync Polymarket markets into our database.
 * Called on a schedule (e.g., every 5 minutes via a cron job or revalidation).
 *
 * Now includes tag-filtered fetch for IRAN to get all Iran markets,
 * not just those in the top 5000 by volume globally.
 */
export async function syncPolymarketMarkets(): Promise<{ synced: number; errors: number; iranSynced?: number }> {
  // First, fetch global events (top 5000 by volume)
  const events = await fetchPolymarketEvents(5000)
  let synced = 0
  let errors = 0

  // Then, fetch Iran-specific events using tag filter
  // This ensures we get all Iran markets, not just high-volume ones
  console.log('[Polymarket] Fetching Iran-specific events...')
  const iranEvents = await fetchPolymarketEventsByTag('iran', 5000)
  console.log(`[Polymarket] Fetched ${iranEvents.length} Iran-specific events`)

  // Merge events, deduplicating by ID (Iran events take precedence)
  const allEventsMap = new Map<string, PolymarketEvent>()
  for (const event of events) {
    allEventsMap.set(event.id, event)
  }
  for (const event of iranEvents) {
    allEventsMap.set(event.id, event)
  }
  const allEvents = Array.from(allEventsMap.values())

  let iranSynced = 0

  for (const event of allEvents) {
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

      // Track if this is an Iran market
      const isIranMarket = category === 'IRAN'

      // Map Polymarket tags to subcategory
      const tagLabels = event.tags?.map(t => t.label) || []
      const subcategorySlug = mapTagsToSubcategory(tagLabels, category)

      // Find subcategory in database if a match was found
      let subcategoryId: string | null = null
      if (subcategorySlug) {
        const subcategory = await prisma.subcategory.findUnique({
          where: { slug_category: { slug: subcategorySlug, category } },
          select: { id: true },
        })
        subcategoryId = subcategory?.id || null
      }

      await prisma.market.upsert({
        where: { externalId: event.id },
        update: {
          title: event.title || market.question,
          marketProbability: probability,
          status: event.closed || event.archived ? MarketStatus.CLOSED : MarketStatus.OPEN,
          subcategoryId, // Update subcategory on sync
          category, // Update category in case it changed
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
          subcategoryId, // Assign subcategory on create
        },
      })
      synced++
      if (isIranMarket) iranSynced++
    } catch (err) {
      console.error(`Failed to sync market ${event.id}:`, err)
      errors++
    }
  }

  console.log(`Polymarket sync: ${synced} synced (${iranSynced} Iran markets), ${errors} errors`)

  // Clean up: Close any Polymarket markets that are no longer in the API response
  // These are markets that were closed/archived on Polymarket but not yet marked in our DB
  const activePolymarketIds = new Set(allEvents.map(e => e.id))
  const stalePolymarketMarkets = await prisma.market.findMany({
    where: {
      source: 'POLYMARKET',
      status: MarketStatus.OPEN,
      externalId: { notIn: Array.from(activePolymarketIds) },
    },
    select: { id: true, title: true },
  })

  if (stalePolymarketMarkets.length > 0) {
    await prisma.market.updateMany({
      where: {
        id: { in: stalePolymarketMarkets.map(m => m.id) },
      },
      data: { status: MarketStatus.CLOSED },
    })
    console.log(`[Sync] Closed ${stalePolymarketMarkets.length} stale Polymarket markets:`, stalePolymarketMarkets.map(m => m.title))
  }

  return { synced, errors, iranSynced }
}

/**
 * Check for resolved markets and trigger scoring.
 * Called periodically to catch resolutions.
 *
 * For POLYMARKET: Fetches live outcome from Polymarket API
 * For USER_CREATED: Auto-closes when resolvesAt passes (admin still sets outcome)
 */
export async function checkMarketResolutions(): Promise<void> {
  // 1. Handle Polymarket markets (full auto-resolve with API outcome)
  const pendingPolymarket = await prisma.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      resolvesAt: { lte: new Date() },
      source: 'POLYMARKET',
    },
  })

  for (const market of pendingPolymarket) {
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

          // Trigger scoring and update competition leaderboards
          const { scoreMarket, updateCompetitionScores } = await import('@/lib/scoring')
          await scoreMarket(market.id, resolvedValue)
          await updateCompetitionScores(market.id, new Date())
        }
      }
    } catch (err) {
      console.error(`Failed to check resolution for Polymarket market ${market.id}:`, err)
    }
  }

  // 2. Handle USER_CREATED markets (auto-close when resolvesAt passes)
  const pendingCustom = await prisma.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      resolvesAt: { lte: new Date() },
      source: 'USER_CREATED',
    },
  })

  for (const market of pendingCustom) {
    try {
      // Auto-close the market but DON'T resolve (admin still sets outcome)
      await prisma.market.update({
        where: { id: market.id },
        data: {
          status: MarketStatus.CLOSED,
          // No resolvedValue - admin must set it manually
        },
      })
      console.log(`[Custom Market] Auto-closed: ${market.id} (${market.title})`)
    } catch (err) {
      console.error(`Failed to close custom market ${market.id}:`, err)
    }
  }

  if (pendingCustom.length > 0) {
    console.log(`[Custom Markets] Auto-closed ${pendingCustom.length} market(s) past resolution date`)
  }

  // 3. Catch-all: auto-close any remaining OPEN market past its resolution date
  //    from sources without their own handler (KALSHI, METACULUS, etc.).
  //    POLYMARKET is excluded so block 1 can still resolve it once Polymarket's
  //    API confirms the outcome. We mark CLOSED (not RESOLVED) because the
  //    outcome isn't known — admin or the source can set it later.
  const pendingStale = await prisma.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      resolvesAt: { lte: new Date() },
      source: { notIn: ['POLYMARKET', 'USER_CREATED'] },
    },
  })

  for (const market of pendingStale) {
    try {
      await prisma.market.update({
        where: { id: market.id },
        data: { status: MarketStatus.CLOSED },
      })
      console.log(`[Stale Market] Auto-closed: ${market.id} (${market.title})`)
    } catch (err) {
      console.error(`Failed to auto-close stale market ${market.id}:`, err)
    }
  }

  if (pendingStale.length > 0) {
    console.log(`[Stale Markets] Auto-closed ${pendingStale.length} market(s) past resolution date`)
  }

  // 4. Fallback: Auto-close any OPEN market where closesAt has passed,
  //    even if resolvesAt is NULL. This catches old markets like World Cup
  //    that were synced before we started tracking resolvesAt properly.
  const pendingByClosesAt = await prisma.market.findMany({
    where: {
      status: MarketStatus.OPEN,
      resolvesAt: null, // Only for markets without resolvesAt
      closesAt: { lte: new Date() }, // But closesAt has passed
    },
  })

  for (const market of pendingByClosesAt) {
    try {
      await prisma.market.update({
        where: { id: market.id },
        data: { status: MarketStatus.CLOSED },
      })
      console.log(`[Fallback] Auto-closed market by closesAt: ${market.id} (${market.title})`)
    } catch (err) {
      console.error(`Failed to auto-close market by closesAt ${market.id}:`, err)
    }
  }

  if (pendingByClosesAt.length > 0) {
    console.log(`[Fallback] Auto-closed ${pendingByClosesAt.length} market(s) past closesAt date`)
  }
}
