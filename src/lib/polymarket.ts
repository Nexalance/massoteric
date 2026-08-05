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
 * Maps internal subcategory slugs to Polymarket API tag slugs
 * NOTE: Internal slugs now match Polymarket slugs directly for IRAN category.
 * This map is kept for potential future use with other categories.
 */
function mapInternalSlugToPolymarketSlug(internalSlug: string): string {
  // Internal slugs now match Polymarket slugs directly - no translation needed
  return internalSlug
}

/**
 * Finds ALL matching subcategories for an event based on its tags
 * Returns an array of subcategory slugs (allows events to belong to multiple subcategories)
 */
function mapTagsToAllSubcategories(tagSlugs: string[], category: MarketCategory): string[] {
  if (!tagSlugs || tagSlugs.length === 0) return []

  const matchingSubcategories: string[] = []
  const tagLower = tagSlugs.map(t => t.toLowerCase())

  // IRAN mappings - ONLY match exact Polymarket tag SLUGS
  // Note: tagSlugs are slugs like 'iranian-leadership-regime', not labels
  // Internal slugs now match Polymarket slugs directly
  // IMPORTANT: Order matters! First matched subcategory becomes the "primary" entry
  // Order by specificity - most specific tags first to avoid misclassification
  if (category === 'IRAN') {
    // Most specific: nuclear, lebanon, oil - these should take priority over broader tags
    if (tagLower.some(t => t === 'nuclear')) matchingSubcategories.push('nuclear')
    if (tagLower.some(t => t === 'lebanon')) matchingSubcategories.push('lebanon')
    if (tagLower.some(t => t === 'oil')) matchingSubcategories.push('oil')
    // Then specific IRAN-related topics
    if (tagLower.some(t => t === 'negotiations')) matchingSubcategories.push('negotiations')
    if (tagLower.some(t => t === 'trump-iran')) matchingSubcategories.push('trump-iran')
    if (tagLower.some(t => t === 'peace-deal')) matchingSubcategories.push('peace-deal')
    if (tagLower.some(t => t === 'strait-of-hormuz')) matchingSubcategories.push('strait-of-hormuz')
    if (tagLower.some(t => t === 'diplomacy-ceasefire')) matchingSubcategories.push('diplomacy-ceasefire')
    if (tagLower.some(t => t === 'israel-x-iran')) matchingSubcategories.push('israel-x-iran')
    // Finally, regime
    if (tagLower.some(t => t === 'iranian-leadership-regime')) {
      matchingSubcategories.push('iranian-leadership-regime')
    }
  }

  // POLITICS mappings - check all possible matches
  if (category === 'POLITICS' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t === 'trump-daily' || ((t.includes('trump') || t.includes('donald')) && t.includes('daily')))) matchingSubcategories.push('trump-daily')
    if (tagLower.some(t => t === 'primaries' || t.includes('primar'))) matchingSubcategories.push('primaries')
    if (tagLower.some(t => t === 'congress' || t === 'senate' || t === 'house')) matchingSubcategories.push('congress')
    if (tagLower.some(t => t === 'courts' || t.includes('court') || t.includes('justice') || t.includes('scotus'))) matchingSubcategories.push('courts')
    if (tagLower.some(t => t === 'cabinet')) matchingSubcategories.push('trump-cabinet')
    if (tagLower.some(t => t === 'epstein')) matchingSubcategories.push('epstein')
    if (tagLower.some(t => t === 'gov-shutdown' || t.includes('shutdown') || t.includes('funding'))) matchingSubcategories.push('gov-shutdown')
    if (tagLower.some(t => t === 'la-mayor' || (t.includes('la') && t.includes('mayor')))) matchingSubcategories.push('la-mayor')
    if (tagLower.some(t => t === 'german-elections' || (t.includes('german') && t.includes('election')))) matchingSubcategories.push('german-elections')
    if (tagLower.some(t => t === 'uk-elections' || (t.includes('uk') && t.includes('election')))) matchingSubcategories.push('uk-elections')
    if (tagLower.some(t => t === 'french-elections' || (t.includes('french') && t.includes('election')))) matchingSubcategories.push('french-elections')
    if (tagLower.some(t => t === 'mayoral-elections' || t.includes('mayoral'))) matchingSubcategories.push('mayoral-elections')
    if (tagLower.some(t => t === 'us-presidential-election' || (t.includes('us') && (t.includes('election') || t.includes('presidential'))))) matchingSubcategories.push('us-presidential-election')
    if (tagLower.some(t => t === 'south-korea' || t.includes('korea'))) matchingSubcategories.push('south-korea')
    if (tagLower.some(t => t === 'japan')) matchingSubcategories.push('japan')
    if (tagLower.some(t => t === 'china')) matchingSubcategories.push('china')
    if (tagLower.some(t => t === 'brazil')) matchingSubcategories.push('brazil')
    if (tagLower.some(t => t === 'canada')) matchingSubcategories.push('canada')
    if (tagLower.some(t => t === 'venezuela')) matchingSubcategories.push('venezuela')
    if (tagLower.some(t => t === 'turkey')) matchingSubcategories.push('turkey')
    if (tagLower.some(t => t === 'midterms' || t.includes('midterm'))) matchingSubcategories.push('midterms')
    if (tagLower.some(t => t === 'global-elections' || (t.includes('global') && t.includes('election')))) matchingSubcategories.push('global-elections')
    if (tagLower.some(t => t === 'trump' || t.includes('trump') || t.includes('donald'))) matchingSubcategories.push('trump')
  }

  // FINANCE mappings - check all possible matches
  if (category === 'FINANCE' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('stock') || t.includes('equity') || t.includes('s&p') || t.includes('nasdaq'))) matchingSubcategories.push('stocks')
    if (tagLower.some(t => t === 'indicies' || t.includes('index'))) matchingSubcategories.push('indicies')
    if (tagLower.some(t => t.includes('earning') || t.includes('revenue'))) matchingSubcategories.push('earnings')
    if (tagLower.some(t => t.includes('commodit'))) matchingSubcategories.push('commodities')
    if (tagLower.some(t => t.includes('forex') || t.includes('currenc'))) matchingSubcategories.push('forex')
    if (tagLower.some(t => t.includes('private'))) matchingSubcategories.push('privates')
    if (tagLower.some(t => t.includes('acquisition') || t.includes('merger') || t.includes('m&a'))) matchingSubcategories.push('acquisitions')
    if (tagLower.some(t => t === 'ipo' || t.includes('ipo'))) matchingSubcategories.push('ipo')
    if (tagLower.some(t => t.includes('fed') && t.includes('rate'))) matchingSubcategories.push('fed-rates')
    if (tagLower.some(t => t.includes('prediction') && t.includes('market'))) matchingSubcategories.push('prediction-markets')
    if (tagLower.some(t => t.includes('treasur'))) matchingSubcategories.push('treasuries')
    if (tagLower.some(t => t.includes('kpi'))) matchingSubcategories.push('kpis')
  }

  // CRYPTO mappings - check all possible matches
  if (category === 'CRYPTO' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('bitcoin') || t.includes('btc'))) matchingSubcategories.push('bitcoin')
    if (tagLower.some(t => t.includes('ethereum') || t.includes('eth'))) matchingSubcategories.push('ethereum')
    if (tagLower.some(t => t.includes('solana') || t.includes('sol'))) matchingSubcategories.push('solana')
    if (tagLower.some(t => t.includes('xrp') || t.includes('ripple'))) matchingSubcategories.push('xrp')
    if (tagLower.some(t => t.includes('dogecoin') || t.includes('doge'))) matchingSubcategories.push('dogecoin')
    if (tagLower.some(t => t.includes('bnb') || t.includes('binance'))) matchingSubcategories.push('bnb')
    if (tagLower.some(t => t.includes('microstrategy') || t.includes('mstr'))) matchingSubcategories.push('microstrategy')
  }

  // SPORTS mappings - check all possible matches
  if (category === 'SPORTS' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('ufc') || t.includes('mma'))) matchingSubcategories.push('ufc')
    if (tagLower.some(t => t.includes('soccer') || t.includes('football'))) matchingSubcategories.push('soccer')
    if (tagLower.some(t => t.includes('tennis'))) matchingSubcategories.push('tennis')
    if (tagLower.some(t => t.includes('cricket'))) matchingSubcategories.push('cricket')
    if (tagLower.some(t => t.includes('basketball') || t.includes('nba') || t.includes('wnba'))) matchingSubcategories.push('basketball')
    if (tagLower.some(t => t.includes('baseball') || t.includes('mlb') || t.includes('kbo') || t.includes('npb') || t.includes('cpbl'))) matchingSubcategories.push('baseball')
    if (tagLower.some(t => t.includes('nfl') || t === 'football')) matchingSubcategories.push('football')
    if (tagLower.some(t => t.includes('hockey') || t.includes('nhl'))) matchingSubcategories.push('hockey')
    if (tagLower.some(t => t.includes('rugby'))) matchingSubcategories.push('rugby')
    if (tagLower.some(t => t.includes('table tennis'))) matchingSubcategories.push('table-tennis')
    if (tagLower.some(t => t.includes('volleyball'))) matchingSubcategories.push('volleyball')
    if (tagLower.some(t => t.includes('golf'))) matchingSubcategories.push('golf')
    if (tagLower.some(t => t.includes('combat') || t.includes('fight'))) matchingSubcategories.push('combat')
    if (tagLower.some(t => t.includes('motor'))) matchingSubcategories.push('motorsports')
    if (tagLower.some(t => t.includes('cycl'))) matchingSubcategories.push('cycling')
    if (tagLower.some(t => t.includes('poker'))) matchingSubcategories.push('poker')
    if (tagLower.some(t => t.includes('chess'))) matchingSubcategories.push('chess')
    if (tagLower.some(t => t.includes('pickleball'))) matchingSubcategories.push('pickleball')
    if (tagLower.some(t => t.includes('lacrosse'))) matchingSubcategories.push('lacrosse')
    if (tagLower.some(t => t.includes('esports') || t.includes('esport'))) matchingSubcategories.push('esports')
  }

  // SCIENCE mappings - check all possible matches
  if (category === 'SCIENCE' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('hurricane') || t.includes('tornado') || t.includes('storm'))) matchingSubcategories.push('hurricanes')
    if (tagLower.some(t => t.includes('global') && t.includes('temp'))) matchingSubcategories.push('global-temp')
    if (tagLower.some(t => t.includes('weather') || t.includes('temperature'))) matchingSubcategories.push('weather')
    if (tagLower.some(t => t.includes('ai') || t.includes('artificial intelligence'))) matchingSubcategories.push('ai')
    if (tagLower.some(t => t.includes('space') || t.includes('nasa') || t.includes('spacex'))) matchingSubcategories.push('spacex')
    if (tagLower.some(t => t.includes('pandemic') || t.includes('covid') || t.includes('virus'))) matchingSubcategories.push('pandemics')
  }

  // TECH mappings - check all possible matches
  if (category === 'TECH' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('ai') || t.includes('llm') || t.includes('artificial intelligence'))) matchingSubcategories.push('ai')
    if (tagLower.some(t => t.includes('elon') && t.includes('musk'))) matchingSubcategories.push('elon-musk')
    if (tagLower.some(t => t.includes('app') && t.includes('store'))) matchingSubcategories.push('app-store')
    if (tagLower.some(t => t.includes('spacex'))) matchingSubcategories.push('spacex')
    if (tagLower.some(t => t.includes('apple'))) matchingSubcategories.push('apple')
    if (tagLower.some(t => t.includes('science') && !t.includes('tech'))) matchingSubcategories.push('science')
    if (tagLower.some(t => t.includes('openai') || t.includes('chatgpt'))) matchingSubcategories.push('openai')
    if (tagLower.some(t => t.includes('microstrategy') || t.includes('mstr'))) matchingSubcategories.push('microstrategy')
    if (tagLower.some(t => t.includes('big tech') || t.includes('big-tech'))) matchingSubcategories.push('big-tech')
    if (tagLower.some(t => t.includes('tiktok') || t.includes('tik tok'))) matchingSubcategories.push('tiktok')
    if (tagLower.some(t => t.includes('prediction') && t.includes('market'))) matchingSubcategories.push('prediction-markets')
  }

  // ECONOMY mappings - check all possible matches
  if (category === 'ECONOMY' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('trade') && t.includes('war'))) matchingSubcategories.push('trade-war')
    if (tagLower.some(t => t.includes('fed') && t.includes('rate'))) matchingSubcategories.push('fed-rates')
    if (tagLower.some(t => t.includes('inflation') || t.includes('cpi') || t.includes('pce'))) matchingSubcategories.push('inflation')
    if (tagLower.some(t => t.includes('macro') || t.includes('indicator'))) matchingSubcategories.push('macro-indicators')
    if (tagLower.some(t => t.includes('gdp'))) matchingSubcategories.push('gdp')
    if (tagLower.some(t => t.includes('global') && t.includes('rate'))) matchingSubcategories.push('global-rates')
    if (tagLower.some(t => t.includes('tax'))) matchingSubcategories.push('taxes')
    if (tagLower.some(t => t.includes('treasur'))) matchingSubcategories.push('treasuries')
    if (tagLower.some(t => t.includes('consumer') || t.includes('spending'))) matchingSubcategories.push('consumer')
    if (tagLower.some(t => t.includes('housing') || t.includes('mortgage'))) matchingSubcategories.push('housing')
    if (tagLower.some(t => t.includes('labor') || t.includes('jobs') || t.includes('unemploy'))) matchingSubcategories.push('labor')
  }

  // CULTURE mappings - check all possible matches
  if (category === 'CULTURE' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('art') && !t.includes('mart'))) matchingSubcategories.push('art')
    if (tagLower.some(t => t.includes('music') || t.includes('song'))) matchingSubcategories.push('music')
    if (tagLower.some(t => t.includes('celebrit') || t.includes('famous'))) matchingSubcategories.push('celebrities')
    if (tagLower.some(t => t.includes('award'))) matchingSubcategories.push('awards')
    if (tagLower.some(t => t.includes('mrbeast') || t.includes('mr beast'))) matchingSubcategories.push('mrbeast')
    if (tagLower.some(t => t.includes('movie') || t.includes('film'))) matchingSubcategories.push('movies')
    if (tagLower.some(t => t.includes('taylor') && t.includes('swift'))) matchingSubcategories.push('taylor-swift')
    if (tagLower.some(t => t.includes('gta'))) matchingSubcategories.push('gta-vi')
    if (tagLower.some(t => t.includes('twitter') || t.includes('tweet'))) matchingSubcategories.push('twitter')
    if (tagLower.some(t => t.includes('youtube'))) matchingSubcategories.push('youtube')
    if (tagLower.some(t => t.includes('reality') && t.includes('tv'))) matchingSubcategories.push('reality-tv')
    if (tagLower.some(t => t.includes('alien') || t.includes('ufo'))) matchingSubcategories.push('aliens')
    if (tagLower.some(t => t.includes('eurovision'))) matchingSubcategories.push('eurovision')
    if (tagLower.some(t => t.includes('court') || t.includes('justice'))) matchingSubcategories.push('courts')
  }

  // GEOPOLITICS mappings - check all possible matches
  // Note: event.tags stores LABELS not slugs
  if (category === 'GEOPOLITICS' && matchingSubcategories.length === 0) {
    // Match Iran Regime specifically for GEOPOLITICS too
    if (tagLower.some(t => t === 'iran regime' || t === 'regime' || t === 'iranian regime')) matchingSubcategories.push('iran')
    if (tagLower.some(t => t.includes('lebanon') && !t.includes('israel'))) matchingSubcategories.push('lebanon')
    if (tagLower.some(t => t.includes('oil') && (t.includes('price') || t.includes('energy')))) matchingSubcategories.push('oil')
    if (tagLower.some(t => t.includes('ukraine'))) matchingSubcategories.push('ukraine')
    if (tagLower.some(t => t.includes('ukraine') && t.includes('map'))) matchingSubcategories.push('ukraine-map')
    if (tagLower.some(t => t.includes('cuba'))) matchingSubcategories.push('cuba')
    if (tagLower.some(t => t.includes('venezuela'))) matchingSubcategories.push('venezuela')
    if (tagLower.some(t => t.includes('middle') && t.includes('east'))) matchingSubcategories.push('middle-east')
    if (tagLower.some(t => t.includes('gaza'))) matchingSubcategories.push('gaza')
    if (tagLower.some(t => t.includes('israel'))) matchingSubcategories.push('israel')
    if (tagLower.some(t => t.includes('syria'))) matchingSubcategories.push('syria')
    if (tagLower.some(t => t.includes('yemen'))) matchingSubcategories.push('yemen')
    if (tagLower.some(t => t.includes('turkey'))) matchingSubcategories.push('turkey')
    if (tagLower.some(t => t.includes('sudan'))) matchingSubcategories.push('sudan')
    if (tagLower.some(t => t.includes('china'))) matchingSubcategories.push('china')
    if (tagLower.some(t => t.includes('india') && t.includes('pakistan'))) matchingSubcategories.push('india-pakistan')
  }

  // WEATHER mappings - check all possible matches
  if (category === 'WEATHER' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('temperature') || t.includes('temp'))) matchingSubcategories.push('temperature')
    if (tagLower.some(t => t === 'high-temperature' || t.includes('high') && t.includes('temp'))) matchingSubcategories.push('high-temperature')
    if (tagLower.some(t => t === 'low-temperature' || t.includes('low') && t.includes('temp'))) matchingSubcategories.push('low-temperature')
    if (tagLower.some(t => t.includes('precipitation') || t.includes('rain') || t.includes('snow'))) matchingSubcategories.push('precipitation')
    if (tagLower.some(t => t.includes('global'))) matchingSubcategories.push('global')
    if (tagLower.some(t => t === 'tornadoes' || t.includes('tornado'))) matchingSubcategories.push('tornadoes')
    if (tagLower.some(t => t === 'hurricanes' || t.includes('hurricane') || t.includes('typhoon'))) matchingSubcategories.push('hurricanes')
    if (tagLower.some(t => t === 'earthquakes' || t.includes('earthquake') || t.includes('seismic'))) matchingSubcategories.push('earthquakes')
    if (tagLower.some(t => t === 'volcanoes' || t.includes('volcano') || t.includes('eruption'))) matchingSubcategories.push('volcanoes')
    if (tagLower.some(t => t === 'pandemics' || t.includes('pandemic') || t.includes('virus'))) matchingSubcategories.push('pandemics')
  }

  // ELECTIONS mappings - check all possible matches
  if (category === 'ELECTIONS' && matchingSubcategories.length === 0) {
    if (tagLower.some(t => t.includes('australia') || t.includes('australian'))) matchingSubcategories.push('australia')
    if (tagLower.some(t => t.includes('brazil') || t.includes('brazilian'))) matchingSubcategories.push('brazil')
    if (tagLower.some(t => t.includes('bulgaria') || t.includes('bulgarian'))) matchingSubcategories.push('bulgaria')
    if (tagLower.some(t => t.includes('canada') || t.includes('canadian'))) matchingSubcategories.push('canada')
    if (tagLower.some(t => t.includes('estonia') || t.includes('estonian'))) matchingSubcategories.push('estonia')
    if (tagLower.some(t => t.includes('france') || t.includes('french'))) matchingSubcategories.push('france')
    if (tagLower.some(t => t.includes('germany') || t.includes('german'))) matchingSubcategories.push('germany')
    if (tagLower.some(t => t.includes('greece') || t.includes('greek'))) matchingSubcategories.push('greece')
    if (tagLower.some(t => t.includes('guinea') && t.includes('bissau'))) matchingSubcategories.push('guinea-bissau')
    if (tagLower.some(t => t.includes('haiti') || t.includes('haitian'))) matchingSubcategories.push('haiti')
    if (tagLower.some(t => t.includes('hungary') || t.includes('hungarian'))) matchingSubcategories.push('hungary')
    if (tagLower.some(t => t.includes('india') || t.includes('indian'))) matchingSubcategories.push('india')
    if (tagLower.some(t => t.includes('israel') || t.includes('israeli'))) matchingSubcategories.push('israel')
    if (tagLower.some(t => t.includes('kazakhstan') || t.includes('kazakh'))) matchingSubcategories.push('kazakhstan')
    if (tagLower.some(t => t.includes('latvia') || t.includes('latvian'))) matchingSubcategories.push('latvia')
    if (tagLower.some(t => t.includes('mexico') || t.includes('mexican'))) matchingSubcategories.push('mexico')
    if (tagLower.some(t => t.includes('morocco') || t.includes('moroccan'))) matchingSubcategories.push('morocco')
    if (tagLower.some(t => t.includes('new zealand') || t.includes('nz'))) matchingSubcategories.push('new-zealand')
    if (tagLower.some(t => t.includes('nigeria') || t.includes('nigerian'))) matchingSubcategories.push('nigeria')
    if (tagLower.some(t => t.includes('peru') || t.includes('peruvian'))) matchingSubcategories.push('peru')
    if (tagLower.some(t => t.includes('philippines') || t.includes('philippine'))) matchingSubcategories.push('philippines')
    if (tagLower.some(t => t.includes('romania') || t.includes('romanian'))) matchingSubcategories.push('romania')
    if (tagLower.some(t => t.includes('russia') || t.includes('russian'))) matchingSubcategories.push('russia')
    if (tagLower.some(t => t.includes('serbia') || t.includes('serbian'))) matchingSubcategories.push('serbia')
    if (tagLower.some(t => t.includes('south africa') || t.includes('south african'))) matchingSubcategories.push('south-africa')
    if (tagLower.some(t => t.includes('sweden') || t.includes('swedish'))) matchingSubcategories.push('sweden')
    if (tagLower.some(t => t.includes('switzerland') || t.includes('swiss'))) matchingSubcategories.push('switzerland')
    if (tagLower.some(t => t.includes('taiwan') || t.includes('taiwanese'))) matchingSubcategories.push('taiwan')
    if (tagLower.some(t => t.includes('uk') || t.includes('united kingdom') || t.includes('british'))) matchingSubcategories.push('uk')
    if (tagLower.some(t => t.includes('us') || t.includes('united states') || t.includes('america'))) matchingSubcategories.push('us')
    if (tagLower.some(t => t.includes('zambia') || t.includes('zambian'))) matchingSubcategories.push('zambia')
  }

  // For categories not covered above, use single-match logic
  if (matchingSubcategories.length === 0) {
    const singleMatch = mapTagsToSubcategory(tagSlugs, category)
    if (singleMatch) matchingSubcategories.push(singleMatch)
  }

  return matchingSubcategories
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
    { slug: 'indicies', label: 'Indices', order: 3 },
    { slug: 'commodities', label: 'Commodities', order: 4 },
    { slug: 'forex', label: 'Forex', order: 5 },
    { slug: 'privates', label: 'Privates', order: 6 },
    { slug: 'acquisitions', label: 'Acquisitions', order: 7 },
    { slug: 'ipo', label: 'IPO', order: 8 },
    { slug: 'fed-rates', label: 'Fed Rates', order: 9 },
    { slug: 'prediction-markets', label: 'Prediction Markets', order: 10 },
    { slug: 'treasuries', label: 'Treasuries', order: 11 },
    { slug: 'kpis', label: 'KPIs', order: 12 },
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
    { slug: 'diplomacy-ceasefire', label: 'Iran Ceasefire', order: 1 },
    { slug: 'trump-iran', label: 'U.S. x Iran', order: 2 },
    { slug: 'strait-of-hormuz', label: 'Strait of Hormuz', order: 3 },
    { slug: 'peace-deal', label: 'Peace Deal', order: 4 },
    { slug: 'negotiations', label: 'Negotiation Topics', order: 5 },
    { slug: 'oil', label: 'Oil', order: 6 },
    { slug: 'israel-x-iran', label: 'Israel x Iran', order: 7 },
    { slug: 'lebanon', label: 'Lebanon', order: 8 },
    { slug: 'iranian-leadership-regime', label: 'Iran Regime', order: 9 },
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
    { slug: 'twitter', label: 'Tweet Markets', order: 9 },
    { slug: 'youtube', label: 'YouTube', order: 10 },
    { slug: 'reality-tv', label: 'Reality TV', order: 11 },
    { slug: 'aliens', label: 'Aliens', order: 12 },
    { slug: 'courts', label: 'Courts', order: 13 },
    { slug: 'eurovision', label: 'Eurovision', order: 14 },
  ],
  WEATHER: [
    { slug: 'temperature', label: 'Temperature', order: 1 },
    { slug: 'high-temperature', label: 'High Temp', order: 2 },
    { slug: 'low-temperature', label: 'Low Temp', order: 3 },
    { slug: 'precipitation', label: 'Precipitation', order: 4 },
    { slug: 'global', label: 'Global', order: 5 },
    { slug: 'tornadoes', label: 'Tornadoes', order: 6 },
    { slug: 'hurricanes', label: 'Hurricanes', order: 7 },
    { slug: 'earthquakes', label: 'Earthquakes', order: 8 },
    { slug: 'volcanoes', label: 'Volcanoes', order: 9 },
    { slug: 'pandemics', label: 'Pandemics', order: 10 },
  ],
  ELECTIONS: [
    { slug: 'australia', label: 'Australia', order: 1 },
    { slug: 'brazil', label: 'Brazil', order: 2 },
    { slug: 'bulgaria', label: 'Bulgaria', order: 3 },
    { slug: 'canada', label: 'Canada', order: 4 },
    { slug: 'estonia', label: 'Estonia', order: 5 },
    { slug: 'france', label: 'France', order: 6 },
    { slug: 'germany', label: 'Germany', order: 7 },
    { slug: 'greece', label: 'Greece', order: 8 },
    { slug: 'guinea-bissau', label: 'Guinea-Bissau', order: 9 },
    { slug: 'haiti', label: 'Haiti', order: 10 },
    { slug: 'hungary', label: 'Hungary', order: 11 },
    { slug: 'india', label: 'India', order: 12 },
    { slug: 'israel', label: 'Israel', order: 13 },
    { slug: 'kazakhstan', label: 'Kazakhstan', order: 14 },
    { slug: 'latvia', label: 'Latvia', order: 15 },
    { slug: 'mexico', label: 'Mexico', order: 16 },
    { slug: 'morocco', label: 'Morocco', order: 17 },
    { slug: 'new-zealand', label: 'New Zealand', order: 18 },
    { slug: 'nigeria', label: 'Nigeria', order: 19 },
    { slug: 'peru', label: 'Peru', order: 20 },
    { slug: 'philippines', label: 'Philippines', order: 21 },
    { slug: 'romania', label: 'Romania', order: 22 },
    { slug: 'russia', label: 'Russia', order: 23 },
    { slug: 'serbia', label: 'Serbia', order: 24 },
    { slug: 'south-africa', label: 'South Africa', order: 25 },
    { slug: 'sweden', label: 'Sweden', order: 26 },
    { slug: 'switzerland', label: 'Switzerland', order: 27 },
    { slug: 'taiwan', label: 'Taiwan', order: 28 },
    { slug: 'uk', label: 'United Kingdom', order: 29 },
    { slug: 'us', label: 'United States', order: 30 },
    { slug: 'zambia', label: 'Zambia', order: 31 },
  ],
  ELECTIONS: [
    { slug: 'australia', label: 'Australia', order: 1 },
    { slug: 'brazil', label: 'Brazil', order: 2 },
    { slug: 'bulgaria', label: 'Bulgaria', order: 3 },
    { slug: 'canada', label: 'Canada', order: 4 },
    { slug: 'estonia', label: 'Estonia', order: 5 },
    { slug: 'france', label: 'France', order: 6 },
    { slug: 'germany', label: 'Germany', order: 7 },
    { slug: 'greece', label: 'Greece', order: 8 },
    { slug: 'guinea-bissau', label: 'Guinea-Bissau', order: 9 },
    { slug: 'haiti', label: 'Haiti', order: 10 },
    { slug: 'hungary', label: 'Hungary', order: 11 },
    { slug: 'india', label: 'India', order: 12 },
    { slug: 'israel', label: 'Israel', order: 13 },
    { slug: 'kazakhstan', label: 'Kazakhstan', order: 14 },
    { slug: 'latvia', label: 'Latvia', order: 15 },
    { slug: 'mexico', label: 'Mexico', order: 16 },
    { slug: 'morocco', label: 'Morocco', order: 17 },
    { slug: 'new-zealand', label: 'New Zealand', order: 18 },
    { slug: 'nigeria', label: 'Nigeria', order: 19 },
    { slug: 'peru', label: 'Peru', order: 20 },
    { slug: 'philippines', label: 'Philippines', order: 21 },
    { slug: 'romania', label: 'Romania', order: 22 },
    { slug: 'russia', label: 'Russia', order: 23 },
    { slug: 'serbia', label: 'Serbia', order: 24 },
    { slug: 'south-africa', label: 'South Africa', order: 25 },
    { slug: 'sweden', label: 'Sweden', order: 26 },
    { slug: 'switzerland', label: 'Switzerland', order: 27 },
    { slug: 'taiwan', label: 'Taiwan', order: 28 },
    { slug: 'uk', label: 'United Kingdom', order: 29 },
    { slug: 'us', label: 'United States', order: 30 },
    { slug: 'zambia', label: 'Zambia', order: 31 },
  ],
}

/**
 * Sync Polymarket's curated subcategories into our Subcategory table
 * Only syncs the subcategories that Polymarket shows in their navigation
 * Removes any subcategories that are not in the curated list
 * @param categoryFilter - If provided, only sync subcategories for this category
 */
export async function syncPolymarketSubcategories(categoryFilter: string | null = null): Promise<{ created: number; updated: number; deleted: number }> {
  let created = 0
  let updated = 0
  let deleted = 0

  // Collect all curated (slug, category) pairs - using composite key
  // If categoryFilter is provided, only include pairs from that category
  const curatedPairs = new Set<string>()
  for (const [category, subcategories] of Object.entries(POLYMARKET_CURATED_SUBCATEGORIES)) {
    // Skip this category if we're filtering and it doesn't match
    if (categoryFilter && category !== categoryFilter) {
      continue
    }
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
function mapCategory(tags: { label: string; slug?: string }[]): MarketCategory {
  const labels = tags.map(t => t.label.toLowerCase())

  // IRAN - check first (most specific)
  // Includes Lebanon, Hezbollah, and Oil as they are IRAN subcategories in Polymarket
  if (labels.some(l =>
    l.includes('iran') ||
    l.includes('iranian') ||
    l.includes('tehran') ||
    l.includes('lebanon') ||
    l.includes('hezbollah')
  ) || tags.some(t => t.slug === 'oil')) return 'IRAN'

  // POLITICS - substring match (catches "US Politics", "Politics 2025", etc.)
  if (labels.some(l => l.includes('politics') || l.includes('election') || l.includes('government'))) return 'POLITICS'

  // CRYPTO - substring match
  if (labels.some(l => l.includes('crypto') || l.includes('bitcoin') || l.includes('ethereum') || l.includes('defi'))) return 'CRYPTO'

  // FINANCE - substring match
  if (labels.some(l => l.includes('finance') || l.includes('stocks') || l.includes('fed') || l.includes('economy') || l.includes('markets'))) return 'FINANCE'

  // SPORTS - substring match
  if (labels.some(l => l.includes('sports') || l.includes('nfl') || l.includes('nba') || l.includes('soccer') || l.includes('football'))) return 'SPORTS'

  // GEOPOLITICS - substring match (war, conflicts, international relations)
  // Note: Lebanon/Hezbollah events are now IRAN, so exclude them here
  if (labels.some(l =>
      l.includes('geopol') ||
      l.includes('war') ||
      l.includes('conflict') ||
      l.includes('israel') ||  // Keep israel for GEOPOLITICS (it's checked after IRAN)
      l.includes('palestine') ||
      l.includes('hamas') ||
      l.includes('ukraine') ||
      l.includes('russia') ||
      l.includes('invasion')
    ) &&
    !labels.some(l => l.includes('lebanon') || l.includes('hezbollah'))
  ) return 'GEOPOLITICS'

  // CULTURE - substring match (tiktok now in TECH)
  if (labels.some(l => l.includes('celebrit') || l.includes('music') || l.includes('movie') ||
      l.includes('award') || l.includes('entertainment') || l.includes('art') ||
      l.includes('youtube') || l.includes('twitter'))) return 'CULTURE'

  // WEATHER - substring match
  if (labels.some(l => l.includes('weather') || l.includes('temperature') ||
      l.includes('hurricane') || l.includes('precipitation') || l.includes('tornado'))) return 'WEATHER'

  // ELECTIONS - substring match (global elections)
  if (labels.some(l => (l.includes('election') || l.includes('vote')) &&
      !l.includes('us') && !l.includes('american'))) return 'ELECTIONS'

  // SCIENCE - substring match
  if (labels.some(l => l.includes('science') || l.includes('climate') || l.includes('health') || l.includes('medicine'))) return 'SCIENCE'

  // TECH - substring match or slug check for specific TECH subcategories
  if (labels.some(l => l.includes('tech') || l.includes('technology') || l.includes('ai')) ||
      tags.some(t => t.slug === 'tiktok' || t.slug === 'microstrategy')) return 'TECH'

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
 *
 * @param categoryFilter - Optional category filter (e.g., 'POLITICS', 'FINANCE')
 *                          to sync only subcategories for that category
 */
export async function syncPolymarketMarkets(categoryFilter: string | null = null): Promise<{
  synced: number
  errors: number
  subcategoryCounts: Record<string, number>
  totalFetched: number
}> {
  let synced = 0
  let errors = 0

  // Collect tag slugs from curated subcategories (filtered by category if specified)
  const tagSlugs = new Set<string>()
  for (const [category, subcategories] of Object.entries(POLYMARKET_CURATED_SUBCATEGORIES)) {
    // Skip this category if we're filtering and it doesn't match
    if (categoryFilter && category !== categoryFilter) {
      continue
    }
    for (const subcat of subcategories) {
      tagSlugs.add(subcat.slug)
    }
  }

  console.log(`[Polymarket] Found ${tagSlugs.size} curated subcategories${categoryFilter ? ` for ${categoryFilter}` : ' total'} to sync`)

  // Merge events, deduplicating by ID
  const allEventsMap = new Map<string, PolymarketEvent>()
  let totalFetched = 0
  const fetchErrors: string[] = []

  // Only fetch global events when syncing all categories (no filter)
  // Skip for category-specific syncs to save time
  if (!categoryFilter) {
    console.log('[Polymarket] Fetching global top 5000 events by volume...')
    const globalEvents = await fetchPolymarketEvents(5000)
    console.log(`[Polymarket] Fetched ${globalEvents.length} global events`)
    for (const event of globalEvents) {
      allEventsMap.set(event.id, event)
    }
    totalFetched = globalEvents.length
  } else {
    console.log(`[Polymarket] Skipping global events fetch for category-specific sync (${categoryFilter})`)
  }

  // Fetch events for each curated subcategory tag
  // This ensures we get ALL events for each subcategory, not just high-volume ones
  for (const tagSlug of Array.from(tagSlugs)) {
    try {
      // Map internal slug to Polymarket API slug if needed
      const polymarketSlug = mapInternalSlugToPolymarketSlug(tagSlug)
      console.log(`[Polymarket] Fetching events for tag: ${tagSlug} (API slug: ${polymarketSlug})...`)
      const tagEvents = await fetchPolymarketEventsByTag(polymarketSlug, 5000)
      console.log(`[Polymarket] Fetched ${tagEvents.length} events for tag: ${tagSlug}`)

      totalFetched += tagEvents.length

      // Merge into main map (tag-specific events take precedence over global)
      for (const event of tagEvents) {
        allEventsMap.set(event.id, event)
      }
    } catch (err) {
      const errorMsg = `Failed to fetch events for tag "${tagSlug}": ${err}`
      console.error(`[Polymarket] ${errorMsg}`)
      fetchErrors.push(errorMsg)
    }
  }

  const allEvents = Array.from(allEventsMap.values())
  console.log(`[Polymarket] Total unique events after deduplication: ${allEvents.length}`)

  if (fetchErrors.length > 0) {
    console.log(`[Polymarket] ${fetchErrors.length} tag fetches failed (continuing with available data)`)
  }

  // Track sync counts per subcategory slug
  const subcategoryCounts: Record<string, number> = {}

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

      // Determine category based on event tags
      // When syncing for a specific category, only assign that category if the event
      // has tags matching it (events can have multiple tags like "Iran" + "Politics")
      let category = mapCategory(event.tags || [])

      // If syncing for a specific category, check if event has tags for it
      if (categoryFilter) {
        const tagSlugs = event.tags?.map(t => t.slug?.toLowerCase()).filter((s): s is string => !!s) || []
        const hasCategoryTag = tagSlugs.some(t =>
          t.includes(categoryFilter.toLowerCase()) ||
          (categoryFilter === 'IRAN' && (t.includes('iran') || t.includes('iranian') || t === 'lebanon' || t === 'hezbollah' || t === 'oil')) ||
          (categoryFilter === 'POLITICS' && t.includes('politics')) ||
          (categoryFilter === 'CRYPTO' && (t.includes('crypto') || t.includes('bitcoin') || t.includes('ethereum'))) ||
          (categoryFilter === 'SPORTS' && t.includes('sport')) ||
          (categoryFilter === 'FINANCE' && t.includes('finance')) ||
          (categoryFilter === 'TECH' && (t.includes('tech') || t.includes('technology') || t === 'tiktok' || t === 'microstrategy')) ||
          (categoryFilter === 'SCIENCE' && t.includes('science')) ||
          (categoryFilter === 'ECONOMY' && (t.includes('economy') || t.includes('macro'))) ||
          (categoryFilter === 'GEOPOLITICS' && (t.includes('geopol') || t.includes('war') || t.includes('conflict'))) ||
          (categoryFilter === 'CULTURE' && (t.includes('celebr') || t.includes('culture'))) ||
          (categoryFilter === 'WEATHER' && t.includes('weather')) ||
          (categoryFilter === 'ELECTIONS' && (t.includes('election') || t.includes('vote')))
        )
        // Only assign the filtered category if the event actually has matching tags
        if (hasCategoryTag) {
          category = categoryFilter as MarketCategory
        }
        // Otherwise skip this event when syncing for a specific category
        else {
          continue
        }
      }

      // Map Polymarket tags to ALL matching subcategories
      // An event can belong to multiple subcategories (e.g., negotiations + ceasefire)
      const tagSlugs = event.tags?.map(t => t.slug).filter((s): s is string => !!s) || []
      const matchingSubcategories = mapTagsToAllSubcategories(tagSlugs, category)

      // Create a market entry for EACH matching subcategory
      // This allows the same event to appear in multiple subcategory feeds
      for (const subcategorySlug of matchingSubcategories) {
        // Find subcategory in database
        const subcategory = await prisma.subcategory.findUnique({
          where: { slug_category: { slug: subcategorySlug, category } },
          select: { id: true },
        })

        if (!subcategory) {
          console.warn(`[Polymarket] Subcategory not found: ${subcategorySlug}/${category}, skipping`)
          continue
        }

        // Use composite externalId for duplicate entries: {eventId}-{subcategorySlug}
        // The primary entry uses just the eventId, duplicates use the composite format
        const isPrimary = subcategorySlug === matchingSubcategories[0]
        const externalId = isPrimary ? event.id : `${event.id}-${subcategorySlug}`
        const polymarketEventId = event.id // Always use the true Polymarket event ID

        // Validate event has a valid ID for URL construction
        if (!event.id || event.id.length < 5) {
          console.warn(`[Polymarket] Invalid event ID: ${event.id}, skipping`)
          continue
        }

        // Validate the event actually exists on Polymarket (non-blocking)
        const eventUrl = `https://polymarket.com/event/${event.id}`
        // Skip URL validation during sync to avoid blocking on network issues
        // Events with invalid URLs will be filtered out in future syncs when they're closed
        // Consider adding a periodic validation job instead

        try {
          await prisma.market.upsert({
            where: { externalId },
            update: {
              title: event.title || market.question,
              marketProbability: probability,
              status: event.closed || event.archived ? MarketStatus.CLOSED : MarketStatus.OPEN,
              externalUrl: `https://polymarket.com/event/${event.id}`,
              subcategoryId: subcategory.id,
              category,
              polymarketEventId,
              updatedAt: new Date(),
            },
            create: {
              externalId,
              source: 'POLYMARKET',
              category,
              title: event.title || market.question,
              description: event.description || market.description,
              marketProbability: probability,
              imageUrl: event.image,
              closesAt: event.endDate ? new Date(event.endDate) : null,
              resolvesAt: event.endDate ? new Date(event.endDate) : null,
              status: event.closed || event.archived ? MarketStatus.CLOSED : MarketStatus.OPEN,
              externalUrl: `https://polymarket.com/event/${event.id}`,
              tags: event.tags?.map(t => t.label) || [],
              subcategoryId: subcategory.id,
              polymarketEventId,
            },
          })
          synced++
          // Track sync count per subcategory
          subcategoryCounts[subcategorySlug] = (subcategoryCounts[subcategorySlug] || 0) + 1
        } catch (err) {
          console.error(`Failed to sync market ${externalId} for subcategory ${subcategorySlug}:`, err)
          errors++
        }
      }
    } catch (err) {
      console.error(`Failed to sync market ${event.id}:`, err)
      errors++
    }
  }

  // Log sync summary with top subcategories
  const topSubcategories = Object.entries(subcategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  console.log(`Polymarket sync complete:`)
  console.log(`  - Total synced: ${synced}`)
  console.log(`  - Total fetched (pre-dedup): ${totalFetched}`)
  console.log(`  - Errors: ${errors}`)
  console.log(`  - Top subcategories:`)
  for (const [slug, count] of topSubcategories) {
    console.log(`    - ${slug}: ${count}`)
  }

  // Clean up: Close any Polymarket markets that are no longer in the API response
  // These are markets that were closed/archived on Polymarket but not yet marked in our DB
  const activePolymarketIds = new Set(allEvents.map(e => e.id))

  // Fetch all Polymarket OPEN markets and check if their base event ID is still active
  const allOpenMarkets = await prisma.market.findMany({
    where: {
      source: 'POLYMARKET',
      status: MarketStatus.OPEN,
    },
    select: { id: true, externalId: true, polymarketEventId: true, title: true },
  })

  // Extract base event ID from polymarketEventId (preferred) or composite externalIds (fallback)
  const staleMarketIds = allOpenMarkets
    .filter(market => {
      // Use polymarketEventId if available, fallback to externalId parsing
      const baseEventId = market.polymarketEventId || market.externalId?.split('-')[0]
      return baseEventId && !activePolymarketIds.has(baseEventId)
    })
    .map(m => m.id)

  if (staleMarketIds.length > 0) {
    await prisma.market.updateMany({
      where: {
        id: { in: staleMarketIds },
      },
      data: { status: MarketStatus.CLOSED },
    })
    console.log(`[Sync] Closed ${staleMarketIds.length} stale Polymarket markets`)
  }

  return { synced, errors, subcategoryCounts, totalFetched }
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
      polymarketEventId: { not: null }, // Only fetch markets with event IDs
    },
    select: {
      id: true,
      polymarketEventId: true,
      title: true,
      resolvesAt: true,
    },
  })

  for (const market of pendingPolymarket) {
    if (!market.polymarketEventId) continue

    try {
      // Fetch current state from Polymarket
      const res = await fetch(`${BASE_URL}/events/${market.polymarketEventId}`)
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
