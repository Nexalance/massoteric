// ─────────────────────────────────────────────────────────
// SUBCATEGORIES — Curated subcategories per market category
// Matches Polymarket's navigation structure
// ─────────────────────────────────────────────────────────

import { MarketCategory } from '@prisma/client';

export interface SubcategoryDef {
  slug: string;
  label: string;
  category: MarketCategory;
  description?: string;
}

// Subcategories organized by parent category
export const SUBCATEGORIES: Record<MarketCategory, SubcategoryDef[]> = {
  POLITICS: [
    { slug: 'trump', label: 'Trump', category: 'POLITICS', description: 'Trump-related markets and administration policies' },
    { slug: 'elections', label: 'Elections', category: 'POLITICS', description: 'US and global election markets' },
    { slug: 'midterms', label: 'Midterms', category: 'POLITICS', description: 'Congressional and midterm elections' },
    { slug: 'geopolitics', label: 'Geopolitics', category: 'POLITICS', description: 'International relations and conflicts' },
    { slug: 'congress', label: 'Congress', category: 'POLITICS', description: 'House and Senate legislation' },
    { slug: 'courts', label: 'Courts', category: 'POLITICS', description: 'Supreme Court and judicial decisions' },
    { slug: 'iran', label: 'Iran', category: 'POLITICS', description: 'Iran-related politics and sanctions' },
    { slug: 'ukraine', label: 'Ukraine', category: 'POLITICS', description: 'Ukraine-Russia conflict' },
    { slug: 'china', label: 'China', category: 'POLITICS', description: 'China-US relations and policy' },
    { slug: 'government-shutdown', label: 'Government Shutdown', category: 'POLITICS', description: 'Federal funding and shutdowns' },
  ],

  FINANCE: [
    { slug: 'stocks', label: 'Stocks', category: 'FINANCE', description: 'Equity markets and company performance' },
    { slug: 'fed', label: 'Fed', category: 'FINANCE', description: 'Federal Reserve policy and rates' },
    { slug: 'inflation', label: 'Inflation', category: 'FINANCE', description: 'CPI, PCE, and price indicators' },
    { slug: 'economy', label: 'Economy', category: 'FINANCE', description: 'GDP, unemployment, and economic data' },
    { slug: 'earnings', label: 'Earnings', category: 'FINANCE', description: 'Quarterly earnings and company results' },
    { slug: 'recession', label: 'Recession', category: 'FINANCE', description: 'Recession probability and indicators' },
    { slug: 'largest-company', label: 'Largest Company', category: 'FINANCE', description: 'Market cap leader markets' },
  ],

  CRYPTO: [
    { slug: 'bitcoin', label: 'Bitcoin', category: 'CRYPTO', description: 'BTC price and adoption markets' },
    { slug: 'ethereum', label: 'Ethereum', category: 'CRYPTO', description: 'ETH price and ecosystem markets' },
    { slug: 'solana', label: 'Solana', category: 'CRYPTO', description: 'SOL price and developments' },
    { slug: '5min', label: '5 Min', category: 'CRYPTO', description: '5-minute price prediction markets' },
    { slug: 'hourly', label: 'Hourly', category: 'CRYPTO', description: '1-hour price prediction markets' },
    { slug: 'daily', label: 'Daily', category: 'CRYPTO', description: 'Daily price targets' },
    { slug: 'weekly', label: 'Weekly', category: 'CRYPTO', description: 'Weekly price targets' },
    { slug: 'monthly', label: 'Monthly', category: 'CRYPTO', description: 'Monthly price targets' },
    { slug: 'targets', label: 'Targets', category: 'CRYPTO', description: 'Price level targets' },
    { slug: 'institutions', label: 'Institutions', category: 'CRYPTO', description: 'Institutional adoption and ETFs' },
    { slug: 'protocol-metrics', label: 'Protocol Metrics', category: 'CRYPTO', description: 'On-chain metrics and data' },
  ],

  SPORTS: [
    { slug: 'nfl', label: 'NFL', category: 'SPORTS', description: 'Football markets and Super Bowl' },
    { slug: 'nba', label: 'NBA', category: 'SPORTS', description: 'Basketball markets and championships' },
    { slug: 'mlb', label: 'MLB', category: 'SPORTS', description: 'Baseball markets and World Series' },
    { slug: 'soccer', label: 'Soccer', category: 'SPORTS', description: 'Football leagues and tournaments' },
    { slug: 'mma', label: 'MMA', category: 'SPORTS', description: 'UFC and fighting markets' },
    { slug: 'college-football', label: 'College Football', category: 'SPORTS', description: 'NCAA football and championships' },
    { slug: 'golf', label: 'Golf', category: 'SPORTS', description: 'PGA tournaments and majors' },
    { slug: 'tennis', label: 'Tennis', category: 'SPORTS', description: 'ATP and WTA tournaments' },
  ],

  SCIENCE: [
    { slug: 'climate', label: 'Climate', category: 'SCIENCE', description: 'Climate change and temperature records' },
    { slug: 'health', label: 'Health', category: 'SCIENCE', description: 'Medical breakthroughs and pandemics' },
    { slug: 'space', label: 'Space', category: 'SCIENCE', description: 'Space exploration and launches' },
    { slug: 'technology', label: 'Technology', category: 'SCIENCE', description: 'Scientific and tech developments' },
    { slug: 'ai', label: 'AI', category: 'SCIENCE', description: 'Artificial intelligence milestones' },
  ],

  TECH: [
    { slug: 'ai', label: 'AI', category: 'TECH', description: 'Artificial intelligence and LLMs' },
    { slug: 'apple', label: 'Apple', category: 'TECH', description: 'Apple product releases and performance' },
    { slug: 'google', label: 'Google', category: 'TECH', description: 'Alphabet, Google, and AI developments' },
    { slug: 'microsoft', label: 'Microsoft', category: 'TECH', description: 'Microsoft products and AI investments' },
    { slug: 'meta', label: 'Meta', category: 'TECH', description: 'Meta platforms and VR/AR' },
    { slug: 'amazon', label: 'Amazon', category: 'TECH', description: 'Amazon services and performance' },
    { slug: 'tesla', label: 'Tesla', category: 'TECH', description: 'Tesla production and stock' },
    { slug: 'startups', label: 'Startups', category: 'TECH', description: 'Tech startup IPOs and outcomes' },
  ],

  ECONOMY: [
    { slug: 'gdp', label: 'GDP', category: 'ECONOMY', description: 'GDP growth and economic output' },
    { slug: 'inflation', label: 'Inflation', category: 'ECONOMY', description: 'CPI, PCE, and price indicators' },
    { slug: 'unemployment', label: 'Unemployment', category: 'ECONOMY', description: 'Jobs data and labor market' },
    { slug: 'recession', label: 'Recession', category: 'ECONOMY', description: 'Recession probability and indicators' },
    { slug: 'fed-rate', label: 'Fed Rate', category: 'ECONOMY', description: 'Federal funds rate decisions' },
    { slug: 'consumer', label: 'Consumer', category: 'ECONOMY', description: 'Consumer spending and sentiment' },
    { slug: 'housing', label: 'Housing', category: 'ECONOMY', description: 'Real estate and mortgage markets' },
  ],

  OTHER: [
    { slug: 'culture', label: 'Culture', category: 'OTHER', description: 'Pop culture and entertainment' },
    { slug: 'weather', label: 'Weather', category: 'OTHER', description: 'Temperature and weather events' },
    { slug: 'world', label: 'World', category: 'OTHER', description: 'International events not in other categories' },
    { slug: 'business', label: 'Business', category: 'OTHER', description: 'Corporate and business events' },
    { slug: 'art', label: 'Art', category: 'OTHER', description: 'Art markets and NFTs' },
  ],
};

// Get all subcategories as a flat list
export const ALL_SUBCATEGORIES: SubcategoryDef[] = Object.values(SUBCATEGORIES).flat();

// Get subcategories for a specific category
export function getSubcategoriesForCategory(category: MarketCategory): SubcategoryDef[] {
  return SUBCATEGORIES[category] || [];
}

// Find a subcategory by slug within a specific category (category-aware to avoid slug collisions)
export function getSubcategoryBySlug(category: MarketCategory, slug: string): SubcategoryDef | null {
  return (SUBCATEGORIES[category] || []).find(sub => sub.slug === slug) || null;
}

// Map Polymarket event tags to subcategory slug
// Aligned with POLYMARKET_CURATED_SUBCATEGORIES to ensure slugs exist in DB
// Returns null if no match found
export function mapTagsToSubcategory(
  tags: string[],
  category: MarketCategory
): string | null {
  if (!tags || tags.length === 0) return null;

  const tagLower = tags.map(t => t.toLowerCase());

  // IRAN mappings - aligned with curated list
  if (category === 'IRAN') {
    if (tagLower.some(t => t.includes('ceasefire') || t.includes('cease-fire'))) return 'iran-ceasefire';
    if (tagLower.some(t => t.includes('us-iran') || (t.includes('us') && t.includes('iran')))) return 'us-iran';
    if (tagLower.some(t => t.includes('strait') && t.includes('hormuz'))) return 'strait-of-hormuz';
    if (tagLower.some(t => t.includes('peace') && t.includes('deal'))) return 'peace-deal';
    if (tagLower.some(t => t.includes('negotiation'))) return 'negotiation-topics';
    if (tagLower.some(t => t.includes('oil') && !t.includes('israel'))) return 'oil';
    if (tagLower.some(t => t.includes('israel-iran') || t.includes('israel') && t.includes('iran'))) return 'israel-iran';
    if (tagLower.some(t => t.includes('lebanon'))) return 'lebanon';
    if (tagLower.some(t => t.includes('regime') || t.includes('iranian'))) return 'iran-regime';
    if (tagLower.some(t => t.includes('nuclear'))) return 'nuclear';
    return 'iran-regime'; // default
  }

  // POLITICS mappings - aligned with curated list
  if (category === 'POLITICS') {
    if (tagLower.some(t => t.includes('trump') || t.includes('donald'))) return 'trump';
    if (tagLower.some(t => t.includes('trump') && t.includes('daily'))) return 'trump-daily';
    if (tagLower.some(t => t.includes('midterm'))) return 'midterms';
    if (tagLower.some(t => t.includes('global') && t.includes('election'))) return 'global-elections';
    if (tagLower.some(t => t.includes('primar'))) return 'primaries';
    if (tagLower.some(t => t.includes('congress') || t.includes('senate') || t.includes('house'))) return 'congress';
    if (tagLower.some(t => t.includes('cabinet'))) return 'trump-cabinet';
    if (tagLower.some(t => t.includes('court') || t.includes('justice') || t.includes('scotus'))) return 'courts';
    if (tagLower.some(t => t.includes('epstein'))) return 'epstein';
    if (tagLower.some(t => t.includes('shutdown') || t.includes('funding'))) return 'gov-shutdown';
    if (tagLower.some(t => t.includes('la') && t.includes('mayor'))) return 'la-mayor';
    if (tagLower.some(t => t.includes('uk') && t.includes('election'))) return 'uk-elections';
    if (tagLower.some(t => t.includes('german') && t.includes('election'))) return 'german-elections';
    if (tagLower.some(t => t.includes('french') && t.includes('election'))) return 'french-elections';
    if (tagLower.some(t => t.includes('us') && (t.includes('election') || t.includes('presidential')))) return 'us-presidential-election';
    if (tagLower.some(t => t.includes('mayoral'))) return 'mayoral-elections';
    if (tagLower.some(t => t.includes('south korea') || t.includes('korea'))) return 'south-korea';
    if (tagLower.some(t => t.includes('japan'))) return 'japan';
    if (tagLower.some(t => t.includes('china'))) return 'china';
    if (tagLower.some(t => t.includes('brazil'))) return 'brazil';
    if (tagLower.some(t => t.includes('canada'))) return 'canada';
    if (tagLower.some(t => t.includes('venezuela'))) return 'venezuela';
    if (tagLower.some(t => t.includes('turkey'))) return 'turkey';
  }

  // FINANCE mappings - aligned with curated list
  if (category === 'FINANCE') {
    if (tagLower.some(t => t.includes('stock') || t.includes('equity') || t.includes('s&p') || t.includes('nasdaq'))) return 'stocks';
    if (tagLower.some(t => t.includes('earning') || t.includes('revenue'))) return 'earnings';
    if (tagLower.some(t => t.includes('indice') || t.includes('index'))) return 'indices';
    if (tagLower.some(t => t.includes('commodit'))) return 'commodities';
    if (tagLower.some(t => t.includes('forex') || t.includes('currenc'))) return 'forex';
    if (tagLower.some(t => t.includes('private'))) return 'privates';
    if (tagLower.some(t => t.includes('acquisition') || t.includes('merger') || t.includes('m&a'))) return 'acquisitions';
    if (tagLower.some(t => t.includes('fed') && t.includes('rate'))) return 'fed-rates';
    if (tagLower.some(t => t.includes('prediction') && t.includes('market'))) return 'prediction-markets';
    if (tagLower.some(t => t.includes('treasur'))) return 'treasuries';
    if (tagLower.some(t => t.includes('kpi'))) return 'kpis';
  }

  // CRYPTO mappings - aligned with curated list (assets only)
  if (category === 'CRYPTO') {
    if (tagLower.some(t => t.includes('bitcoin') || t.includes('btc'))) return 'bitcoin';
    if (tagLower.some(t => t.includes('ethereum') || t.includes('eth'))) return 'ethereum';
    if (tagLower.some(t => t.includes('solana') || t.includes('sol'))) return 'solana';
    if (tagLower.some(t => t.includes('xrp') || t.includes('ripple'))) return 'xrp';
    if (tagLower.some(t => t.includes('dogecoin') || t.includes('doge'))) return 'dogecoin';
    if (tagLower.some(t => t.includes('bnb') || t.includes('binance'))) return 'bnb';
    if (tagLower.some(t => t.includes('microstrategy') || t.includes('mstr'))) return 'microstrategy';
  }

  // SPORTS mappings - aligned with curated list
  if (category === 'SPORTS') {
    if (tagLower.some(t => t.includes('ufc') || t.includes('mma'))) return 'ufc';
    if (tagLower.some(t => t.includes('soccer') || t.includes('football'))) return 'soccer';
    if (tagLower.some(t => t.includes('tennis'))) return 'tennis';
    if (tagLower.some(t => t.includes('cricket'))) return 'cricket';
    if (tagLower.some(t => t.includes('basketball') || t.includes('nba') || t.includes('wnba'))) return 'basketball';
    if (tagLower.some(t => t.includes('baseball') || t.includes('mlb') || t.includes('kbo') || t.includes('npb') || t.includes('cpbl'))) return 'baseball';
    if (tagLower.some(t => t.includes('nfl') || t.includes('football'))) return 'football';
    if (tagLower.some(t => t.includes('hockey') || t.includes('nhl'))) return 'hockey';
    if (tagLower.some(t => t.includes('rugby'))) return 'rugby';
    if (tagLower.some(t => t.includes('table tennis'))) return 'table-tennis';
    if (tagLower.some(t => t.includes('volleyball'))) return 'volleyball';
    if (tagLower.some(t => t.includes('golf'))) return 'golf';
    if (tagLower.some(t => t.includes('combat') || t.includes('fight'))) return 'combat';
    if (tagLower.some(t => t.includes('motor'))) return 'motorsports';
    if (tagLower.some(t => t.includes('cycl'))) return 'cycling';
    if (tagLower.some(t => t.includes('poker'))) return 'poker';
    if (tagLower.some(t => t.includes('chess'))) return 'chess';
    if (tagLower.some(t => t.includes('pickleball'))) return 'pickleball';
    if (tagLower.some(t => t.includes('lacrosse'))) return 'lacrosse';
    if (tagLower.some(t => t.includes('esports') || t.includes('esport'))) return 'esports';
  }

  // SCIENCE mappings - aligned with curated list
  if (category === 'SCIENCE') {
    if (tagLower.some(t => t.includes('hurricane') || t.includes('tornado') || t.includes('storm'))) return 'hurricanes';
    if (tagLower.some(t => t.includes('global') && t.includes('temp'))) return 'global-temp';
    if (tagLower.some(t => t.includes('weather') || t.includes('temperature'))) return 'weather';
    if (tagLower.some(t => t.includes('ai') || t.includes('artificial intelligence'))) return 'ai';
    if (tagLower.some(t => t.includes('space') || t.includes('nasa') || t.includes('spacex'))) return 'spacex';
    if (tagLower.some(t => t.includes('pandemic') || t.includes('covid') || t.includes('virus'))) return 'pandemics';
  }

  // TECH mappings - aligned with curated list
  if (category === 'TECH') {
    if (tagLower.some(t => t.includes('ai') || t.includes('llm') || t.includes('artificial intelligence'))) return 'ai';
    if (tagLower.some(t => t.includes('elon') && t.includes('musk'))) return 'elon-musk';
    if (tagLower.some(t => t.includes('app') && t.includes('store'))) return 'app-store';
    if (tagLower.some(t => t.includes('spacex'))) return 'spacex';
    if (tagLower.some(t => t.includes('apple'))) return 'apple';
    if (tagLower.some(t => t.includes('science') && !t.includes('tech'))) return 'science';
    if (tagLower.some(t => t.includes('openai') || t.includes('chatgpt'))) return 'openai';
    if (tagLower.some(t => t.includes('microstrategy') || t.includes('mstr'))) return 'microstrategy';
    if (tagLower.some(t => t.includes('big tech') || t.includes('big tech'))) return 'big-tech';
    if (tagLower.some(t => t.includes('tiktok') || t.includes('tik tok'))) return 'tiktok';
    if (tagLower.some(t => t.includes('prediction') && t.includes('market'))) return 'prediction-markets';
  }

  // ECONOMY mappings - aligned with curated list
  if (category === 'ECONOMY') {
    if (tagLower.some(t => t.includes('trade') && t.includes('war'))) return 'trade-war';
    if (tagLower.some(t => t.includes('fed') && t.includes('rate'))) return 'fed-rates';
    if (tagLower.some(t => t.includes('inflation') || t.includes('cpi') || t.includes('pce'))) return 'inflation';
    if (tagLower.some(t => t.includes('macro') || t.includes('indicator'))) return 'macro-indicators';
    if (tagLower.some(t => t.includes('gdp'))) return 'gdp';
    if (tagLower.some(t => t.includes('global') && t.includes('rate'))) return 'global-rates';
    if (tagLower.some(t => t.includes('tax'))) return 'taxes';
    if (tagLower.some(t => t.includes('treasur'))) return 'treasuries';
    if (tagLower.some(t => t.includes('consumer') || t.includes('spending'))) return 'consumer';
    if (tagLower.some(t => t.includes('housing') || t.includes('mortgage'))) return 'housing';
    if (tagLower.some(t => t.includes('labor') || t.includes('jobs') || t.includes('unemploy'))) return 'labor';
  }

  return null; // No subcategory match
}
