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
    { slug: 'trump-daily', label: 'Trump Daily', category: 'POLITICS', description: 'Daily Trump-related markets' },
    { slug: 'midterms', label: 'Midterms', category: 'POLITICS', description: 'Congressional and midterm elections' },
    { slug: 'global-elections', label: 'Global Elections', category: 'POLITICS', description: 'Global election markets' },
    { slug: 'primaries', label: 'Primaries', category: 'POLITICS', description: 'Primary elections' },
    { slug: 'congress', label: 'Congress', category: 'POLITICS', description: 'House and Senate legislation' },
    { slug: 'trump-cabinet', label: 'Trump Cabinet', category: 'POLITICS', description: 'Trump cabinet nominations and confirmations' },
    { slug: 'courts', label: 'Courts', category: 'POLITICS', description: 'Supreme Court and judicial decisions' },
    { slug: 'epstein', label: 'Epstein', category: 'POLITICS', description: 'Epstein-related markets' },
    { slug: 'gov-shutdown', label: 'Gov Shutdown', category: 'POLITICS', description: 'Federal funding and shutdowns' },
    { slug: 'la-mayor', label: 'LA Mayor', category: 'POLITICS', description: 'Los Angeles mayoral election' },
    { slug: 'uk-elections', label: 'UK Elections', category: 'POLITICS', description: 'UK election markets' },
    { slug: 'german-elections', label: 'German Elections', category: 'POLITICS', description: 'German election markets' },
    { slug: 'french-elections', label: 'French Elections', category: 'POLITICS', description: 'French election markets' },
    { slug: 'us-presidential-election', label: 'US Election', category: 'POLITICS', description: 'US Presidential election' },
    { slug: 'mayoral-elections', label: 'Mayoral Elections', category: 'POLITICS', description: 'Mayoral election markets' },
    { slug: 'south-korea', label: 'South Korea', category: 'POLITICS', description: 'South Korea politics' },
    { slug: 'japan', label: 'Japan', category: 'POLITICS', description: 'Japan politics' },
    { slug: 'china', label: 'China', category: 'POLITICS', description: 'China politics and relations' },
    { slug: 'brazil', label: 'Brazil', category: 'POLITICS', description: 'Brazil politics' },
    { slug: 'canada', label: 'Canada', category: 'POLITICS', description: 'Canada politics' },
    { slug: 'venezuela', label: 'Venezuela', category: 'POLITICS', description: 'Venezuela politics' },
    { slug: 'turkey', label: 'Turkey', category: 'POLITICS', description: 'Turkey politics' },
  ],

  IRAN: [
    { slug: 'diplomacy-ceasefire', label: 'Iran Ceasefire', category: 'IRAN', description: 'Iran ceasefire and negotiations' },
    { slug: 'trump-iran', label: 'U.S. x Iran', category: 'IRAN', description: 'US-Iran relations and conflicts' },
    { slug: 'strait-of-hormuz', label: 'Strait of Hormuz', category: 'IRAN', description: 'Strait of Hormuz shipping and tensions' },
    { slug: 'peace-deal', label: 'Peace Deal', category: 'IRAN', description: 'Iran peace deal markets' },
    { slug: 'negotiations', label: 'Negotiation Topics', category: 'IRAN', description: 'Iran nuclear negotiations' },
    { slug: 'oil', label: 'Oil', category: 'IRAN', description: 'Iran oil exports and production' },
    { slug: 'israel-x-iran', label: 'Israel x Iran', category: 'IRAN', description: 'Israel-Iran conflict and tensions' },
    { slug: 'lebanon', label: 'Lebanon', category: 'IRAN', description: 'Lebanon-Iran relations' },
    { slug: 'iranian-leadership-regime', label: 'Iran Regime', category: 'IRAN', description: 'Iran internal politics and regime' },
    { slug: 'nuclear', label: 'Nuclear', category: 'IRAN', description: 'Iran nuclear program' },
  ],

  FINANCE: [
    { slug: 'stocks', label: 'Stocks', category: 'FINANCE', description: 'Equity markets and company performance' },
    { slug: 'earnings', label: 'Earnings', category: 'FINANCE', description: 'Quarterly earnings and company results' },
    { slug: 'indicies', label: 'Indices', category: 'FINANCE', description: 'Market indices and index funds' },
    { slug: 'commodities', label: 'Commodities', category: 'FINANCE', description: 'Commodity markets and prices' },
    { slug: 'forex', label: 'Forex', category: 'FINANCE', description: 'Foreign exchange and currency markets' },
    { slug: 'privates', label: 'Privates', category: 'FINANCE', description: 'Private company markets' },
    { slug: 'acquisitions', label: 'Acquisitions', category: 'FINANCE', description: 'M&A and acquisition markets' },
    { slug: 'ipo', label: 'IPO', category: 'FINANCE', description: 'Initial public offering markets' },
    { slug: 'fed-rates', label: 'Fed Rates', category: 'FINANCE', description: 'Federal Reserve policy and rates' },
    { slug: 'prediction-markets', label: 'Prediction Markets', category: 'FINANCE', description: 'Prediction market platforms' },
    { slug: 'treasuries', label: 'Treasuries', category: 'FINANCE', description: 'Treasury bond markets' },
    { slug: 'kpis', label: 'KPIs', category: 'FINANCE', description: 'Key performance indicator markets' },
  ],

  CRYPTO: [
    { slug: 'bitcoin', label: 'Bitcoin', category: 'CRYPTO', description: 'BTC price and adoption markets' },
    { slug: 'ethereum', label: 'Ethereum', category: 'CRYPTO', description: 'ETH price and ecosystem markets' },
    { slug: 'solana', label: 'Solana', category: 'CRYPTO', description: 'SOL price and developments' },
    { slug: 'xrp', label: 'XRP', category: 'CRYPTO', description: 'XRP price and developments' },
    { slug: 'dogecoin', label: 'Dogecoin', category: 'CRYPTO', description: 'DOGE price and developments' },
    { slug: 'bnb', label: 'BNB', category: 'CRYPTO', description: 'BNB price and developments' },
    { slug: 'microstrategy', label: 'MicroStrategy', category: 'CRYPTO', description: 'MicroStrategy bitcoin holdings' },
  ],

  SPORTS: [
    { slug: 'mlb', label: 'MLB', category: 'SPORTS', description: 'Baseball markets and World Series' },
    { slug: 'ufc', label: 'UFC', category: 'SPORTS', description: 'MMA and fighting markets' },
    { slug: 'soccer', label: 'Soccer', category: 'SPORTS', description: 'Football leagues and tournaments' },
    { slug: 'tennis', label: 'Tennis', category: 'SPORTS', description: 'ATP and WTA tournaments' },
    { slug: 'cricket', label: 'Cricket', category: 'SPORTS', description: 'Cricket matches and tournaments' },
    { slug: 'basketball', label: 'Basketball', category: 'SPORTS', description: 'Basketball markets and championships' },
    { slug: 'baseball', label: 'Baseball', category: 'SPORTS', description: 'Baseball markets and World Series' },
    { slug: 'football', label: 'Football', category: 'SPORTS', description: 'Football markets and Super Bowl' },
    { slug: 'hockey', label: 'Hockey', category: 'SPORTS', description: 'Hockey markets and Stanley Cup' },
    { slug: 'rugby', label: 'Rugby', category: 'SPORTS', description: 'Rugby matches and tournaments' },
    { slug: 'table-tennis', label: 'Table Tennis', category: 'SPORTS', description: 'Table tennis matches' },
    { slug: 'volleyball', label: 'Volleyball', category: 'SPORTS', description: 'Volleyball matches and tournaments' },
    { slug: 'golf', label: 'Golf', category: 'SPORTS', description: 'PGA tournaments and majors' },
    { slug: 'combat', label: 'Combat', category: 'SPORTS', description: 'Combat sports and fighting' },
    { slug: 'motorsports', label: 'Motorsports', category: 'SPORTS', description: 'Racing and motorsports' },
    { slug: 'cycling', label: 'Cycling', category: 'SPORTS', description: 'Cycling races and tours' },
    { slug: 'poker', label: 'Poker', category: 'SPORTS', description: 'Poker tournaments' },
    { slug: 'chess', label: 'Chess', category: 'SPORTS', description: 'Chess matches and tournaments' },
    { slug: 'pickleball', label: 'Pickleball', category: 'SPORTS', description: 'Pickleball matches' },
    { slug: 'lacrosse', label: 'Lacrosse', category: 'SPORTS', description: 'Lacrosse matches' },
    { slug: 'esports', label: 'Esports', category: 'SPORTS', description: 'Esports competitions' },
  ],

  SCIENCE: [
    { slug: 'hurricanes', label: 'Hurricanes', category: 'SCIENCE', description: 'Hurricane tracking and severity markets' },
    { slug: 'global-temp', label: 'Global Temp', category: 'SCIENCE', description: 'Global temperature records' },
    { slug: 'weather', label: 'Weather', category: 'SCIENCE', description: 'Weather patterns and events' },
    { slug: 'ai', label: 'AI', category: 'SCIENCE', description: 'Artificial intelligence milestones' },
    { slug: 'spacex', label: 'SpaceX', category: 'SCIENCE', description: 'SpaceX launches and developments' },
    { slug: 'pandemics', label: 'Pandemics', category: 'SCIENCE', description: 'Pandemic tracking and health events' },
  ],

  TECH: [
    { slug: 'ai', label: 'AI', category: 'TECH', description: 'Artificial intelligence and LLMs' },
    { slug: 'elon-musk', label: 'Elon Musk', category: 'TECH', description: 'Elon Musk companies and developments' },
    { slug: 'app-store', label: 'App Store', category: 'TECH', description: 'App store policies and developments' },
    { slug: 'spacex', label: 'SpaceX', category: 'TECH', description: 'SpaceX launches and developments' },
    { slug: 'apple', label: 'Apple', category: 'TECH', description: 'Apple product releases and performance' },
    { slug: 'science', label: 'Science', category: 'TECH', description: 'Scientific developments and research' },
    { slug: 'openai', label: 'OpenAI', category: 'TECH', description: 'OpenAI products and developments' },
    { slug: 'microstrategy', label: 'MicroStrategy', category: 'TECH', description: 'MicroStrategy stock and bitcoin holdings' },
    { slug: 'big-tech', label: 'Big Tech', category: 'TECH', description: 'Big tech company markets' },
    { slug: 'tiktok', label: 'TikTok', category: 'TECH', description: 'TikTok and ByteDance developments' },
    { slug: 'prediction-markets', label: 'Prediction Markets', category: 'TECH', description: 'Prediction market platforms' },
  ],

  ECONOMY: [
    { slug: 'trade-war', label: 'Trade War', category: 'ECONOMY', description: 'Trade war and tariff markets' },
    { slug: 'fed-rates', label: 'Fed Rates', category: 'ECONOMY', description: 'Federal Reserve policy and rates' },
    { slug: 'inflation', label: 'Inflation', category: 'ECONOMY', description: 'CPI, PCE, and price indicators' },
    { slug: 'macro-indicators', label: 'Macro Indicators', category: 'ECONOMY', description: 'Macroeconomic indicators' },
    { slug: 'gdp', label: 'GDP', category: 'ECONOMY', description: 'GDP growth and economic output' },
    { slug: 'global-rates', label: 'Global Rates', category: 'ECONOMY', description: 'Global interest rates' },
    { slug: 'taxes', label: 'Taxes', category: 'ECONOMY', description: 'Tax policy and rates' },
    { slug: 'treasuries', label: 'Treasuries', category: 'ECONOMY', description: 'Treasury bond markets' },
    { slug: 'consumer', label: 'Consumer', category: 'ECONOMY', description: 'Consumer spending and sentiment' },
    { slug: 'housing', label: 'Housing', category: 'ECONOMY', description: 'Real estate and mortgage markets' },
    { slug: 'labor', label: 'Labor', category: 'ECONOMY', description: 'Jobs data and labor market' },
  ],

  GEOPOLITICS: [
    { slug: 'iran', label: 'Iran', category: 'GEOPOLITICS', description: 'Iran-related politics and conflicts' },
    { slug: 'lebanon', label: 'Lebanon', category: 'GEOPOLITICS', description: 'Lebanon political situation' },
    { slug: 'oil', label: 'Oil', category: 'GEOPOLITICS', description: 'Oil markets and energy geopolitics' },
    { slug: 'ukraine', label: 'Ukraine', category: 'GEOPOLITICS', description: 'Ukraine-Russia conflict' },
    { slug: 'ukraine-map', label: 'Ukraine Map', category: 'GEOPOLITICS', description: 'Ukraine territory control markets' },
    { slug: 'cuba', label: 'Cuba', category: 'GEOPOLITICS', description: 'Cuba politics and relations' },
    { slug: 'venezuela', label: 'Venezuela', category: 'GEOPOLITICS', description: 'Venezuela political situation' },
    { slug: 'middle-east', label: 'Middle East', category: 'GEOPOLITICS', description: 'Middle East conflicts and relations' },
    { slug: 'gaza', label: 'Gaza', category: 'GEOPOLITICS', description: 'Gaza conflict and situation' },
    { slug: 'israel', label: 'Israel', category: 'GEOPOLITICS', description: 'Israel politics and conflicts' },
    { slug: 'syria', label: 'Syria', category: 'GEOPOLITICS', description: 'Syria conflict and situation' },
    { slug: 'yemen', label: 'Yemen', category: 'GEOPOLITICS', description: 'Yemen conflict and humanitarian crisis' },
    { slug: 'turkey', label: 'Turkey', category: 'GEOPOLITICS', description: 'Turkey politics and regional influence' },
    { slug: 'sudan', label: 'Sudan', category: 'GEOPOLITICS', description: 'Sudan conflict and situation' },
    { slug: 'china', label: 'China', category: 'GEOPOLITICS', description: 'China geopolitics and relations' },
    { slug: 'india-pakistan', label: 'India-Pakistan', category: 'GEOPOLITICS', description: 'India-Pakistan relations and conflicts' },
  ],

  CULTURE: [
    { slug: 'art', label: 'Art', category: 'CULTURE', description: 'Art markets and developments' },
    { slug: 'music', label: 'Music', category: 'CULTURE', description: 'Music industry and developments' },
    { slug: 'celebrities', label: 'Celebrities', category: 'CULTURE', description: 'Celebrity news and developments' },
    { slug: 'awards', label: 'Awards', category: 'CULTURE', description: 'Award shows and ceremonies' },
    { slug: 'mrbeast', label: 'MrBeast', category: 'CULTURE', description: 'MrBeast-related markets' },
    { slug: 'movies', label: 'Movies', category: 'CULTURE', description: 'Movie releases and box office' },
    { slug: 'taylor-swift', label: 'Taylor Swift', category: 'CULTURE', description: 'Taylor Swift news and developments' },
    { slug: 'gta-vi', label: 'GTA VI', category: 'CULTURE', description: 'Grand Theft Auto VI release and developments' },
    { slug: 'twitter', label: 'Tweet Markets', category: 'CULTURE', description: 'Twitter/X-related markets' },
    { slug: 'youtube', label: 'YouTube', category: 'CULTURE', description: 'YouTube trends and creators' },
    { slug: 'reality-tv', label: 'Reality TV', category: 'CULTURE', description: 'Reality TV shows and developments' },
    { slug: 'aliens', label: 'Aliens', category: 'CULTURE', description: 'UFO and alien-related markets' },
    { slug: 'courts', label: 'Courts', category: 'CULTURE', description: 'Legal cases and judicial decisions' },
    { slug: 'eurovision', label: 'Eurovision', category: 'CULTURE', description: 'Eurovision song contest' },
  ],

  WEATHER: [
    { slug: 'temperature', label: 'Temperature', category: 'WEATHER', description: 'Temperature records and extremes' },
    { slug: 'high-temperature', label: 'High Temp', category: 'WEATHER', description: 'High temperature records and heat waves' },
    { slug: 'low-temperature', label: 'Low Temp', category: 'WEATHER', description: 'Low temperature records and cold snaps' },
    { slug: 'precipitation', label: 'Precipitation', category: 'WEATHER', description: 'Rainfall, snowfall, and precipitation patterns' },
    { slug: 'global', label: 'Global', category: 'WEATHER', description: 'Global weather and climate patterns' },
    { slug: 'tornadoes', label: 'Tornadoes', category: 'WEATHER', description: 'Tornado activity and forecasts' },
    { slug: 'hurricanes', label: 'Hurricanes', category: 'WEATHER', description: 'Hurricane activity and storm tracking' },
    { slug: 'earthquakes', label: 'Earthquakes', category: 'WEATHER', description: 'Earthquake activity and seismic events' },
    { slug: 'volcanoes', label: 'Volcanoes', category: 'WEATHER', description: 'Volcanic activity and eruptions' },
    { slug: 'pandemics', label: 'Pandemics', category: 'WEATHER', description: 'Pandemic and disease outbreak tracking' },
  ],

  ELECTIONS: [
    { slug: 'australia', label: 'Australia', category: 'ELECTIONS', description: 'Australian elections' },
    { slug: 'brazil', label: 'Brazil', category: 'ELECTIONS', description: 'Brazilian elections' },
    { slug: 'bulgaria', label: 'Bulgaria', category: 'ELECTIONS', description: 'Bulgarian elections' },
    { slug: 'canada', label: 'Canada', category: 'ELECTIONS', description: 'Canadian elections' },
    { slug: 'estonia', label: 'Estonia', category: 'ELECTIONS', description: 'Estonian elections' },
    { slug: 'france', label: 'France', category: 'ELECTIONS', description: 'French elections' },
    { slug: 'germany', label: 'Germany', category: 'ELECTIONS', description: 'German elections' },
    { slug: 'greece', label: 'Greece', category: 'ELECTIONS', description: 'Greek elections' },
    { slug: 'guinea-bissau', label: 'Guinea-Bissau', category: 'ELECTIONS', description: 'Guinea-Bissau elections' },
    { slug: 'haiti', label: 'Haiti', category: 'ELECTIONS', description: 'Haitian elections' },
    { slug: 'hungary', label: 'Hungary', category: 'ELECTIONS', description: 'Hungarian elections' },
    { slug: 'india', label: 'India', category: 'ELECTIONS', description: 'Indian elections' },
    { slug: 'israel', label: 'Israel', category: 'ELECTIONS', description: 'Israeli elections' },
    { slug: 'kazakhstan', label: 'Kazakhstan', category: 'ELECTIONS', description: 'Kazakhstan elections' },
    { slug: 'latvia', label: 'Latvia', category: 'ELECTIONS', description: 'Latvian elections' },
    { slug: 'mexico', label: 'Mexico', category: 'ELECTIONS', description: 'Mexican elections' },
    { slug: 'morocco', label: 'Morocco', category: 'ELECTIONS', description: 'Moroccan elections' },
    { slug: 'new-zealand', label: 'New Zealand', category: 'ELECTIONS', description: 'New Zealand elections' },
    { slug: 'nigeria', label: 'Nigeria', category: 'ELECTIONS', description: 'Nigerian elections' },
    { slug: 'peru', label: 'Peru', category: 'ELECTIONS', description: 'Peruvian elections' },
    { slug: 'philippines', label: 'Philippines', category: 'ELECTIONS', description: 'Philippine elections' },
    { slug: 'romania', label: 'Romania', category: 'ELECTIONS', description: 'Romanian elections' },
    { slug: 'russia', label: 'Russia', category: 'ELECTIONS', description: 'Russian elections' },
    { slug: 'serbia', label: 'Serbia', category: 'ELECTIONS', description: 'Serbian elections' },
    { slug: 'south-africa', label: 'South Africa', category: 'ELECTIONS', description: 'South African elections' },
    { slug: 'sweden', label: 'Sweden', category: 'ELECTIONS', description: 'Swedish elections' },
    { slug: 'switzerland', label: 'Switzerland', category: 'ELECTIONS', description: 'Swiss elections' },
    { slug: 'taiwan', label: 'Taiwan', category: 'ELECTIONS', description: 'Taiwanese elections' },
    { slug: 'uk', label: 'United Kingdom', category: 'ELECTIONS', description: 'UK elections' },
    { slug: 'us', label: 'United States', category: 'ELECTIONS', description: 'US elections' },
    { slug: 'zambia', label: 'Zambia', category: 'ELECTIONS', description: 'Zambian elections' },
  ],

  ELECTIONS: [
    { slug: 'australia', label: 'Australia', category: 'ELECTIONS', description: 'Australian elections' },
    { slug: 'brazil', label: 'Brazil', category: 'ELECTIONS', description: 'Brazilian elections' },
    { slug: 'bulgaria', label: 'Bulgaria', category: 'ELECTIONS', description: 'Bulgarian elections' },
    { slug: 'canada', label: 'Canada', category: 'ELECTIONS', description: 'Canadian elections' },
    { slug: 'estonia', label: 'Estonia', category: 'ELECTIONS', description: 'Estonian elections' },
    { slug: 'france', label: 'France', category: 'ELECTIONS', description: 'French elections' },
    { slug: 'germany', label: 'Germany', category: 'ELECTIONS', description: 'German elections' },
    { slug: 'greece', label: 'Greece', category: 'ELECTIONS', description: 'Greek elections' },
    { slug: 'guinea-bissau', label: 'Guinea-Bissau', category: 'ELECTIONS', description: 'Guinea-Bissau elections' },
    { slug: 'haiti', label: 'Haiti', category: 'ELECTIONS', description: 'Haitian elections' },
    { slug: 'hungary', label: 'Hungary', category: 'ELECTIONS', description: 'Hungarian elections' },
    { slug: 'india', label: 'India', category: 'ELECTIONS', description: 'Indian elections' },
    { slug: 'israel', label: 'Israel', category: 'ELECTIONS', description: 'Israeli elections' },
    { slug: 'kazakhstan', label: 'Kazakhstan', category: 'ELECTIONS', description: 'Kazakhstan elections' },
    { slug: 'latvia', label: 'Latvia', category: 'ELECTIONS', description: 'Latvian elections' },
    { slug: 'mexico', label: 'Mexico', category: 'ELECTIONS', description: 'Mexican elections' },
    { slug: 'morocco', label: 'Morocco', category: 'ELECTIONS', description: 'Moroccan elections' },
    { slug: 'new-zealand', label: 'New Zealand', category: 'ELECTIONS', description: 'New Zealand elections' },
    { slug: 'nigeria', label: 'Nigeria', category: 'ELECTIONS', description: 'Nigerian elections' },
    { slug: 'peru', label: 'Peru', category: 'ELECTIONS', description: 'Peruvian elections' },
    { slug: 'philippines', label: 'Philippines', category: 'ELECTIONS', description: 'Philippine elections' },
    { slug: 'romania', label: 'Romania', category: 'ELECTIONS', description: 'Romanian elections' },
    { slug: 'russia', label: 'Russia', category: 'ELECTIONS', description: 'Russian elections' },
    { slug: 'serbia', label: 'Serbia', category: 'ELECTIONS', description: 'Serbian elections' },
    { slug: 'south-africa', label: 'South Africa', category: 'ELECTIONS', description: 'South African elections' },
    { slug: 'sweden', label: 'Sweden', category: 'ELECTIONS', description: 'Swedish elections' },
    { slug: 'switzerland', label: 'Switzerland', category: 'ELECTIONS', description: 'Swiss elections' },
    { slug: 'taiwan', label: 'Taiwan', category: 'ELECTIONS', description: 'Taiwanese elections' },
    { slug: 'uk', label: 'United Kingdom', category: 'ELECTIONS', description: 'UK elections' },
    { slug: 'us', label: 'United States', category: 'ELECTIONS', description: 'US elections' },
    { slug: 'zambia', label: 'Zambia', category: 'ELECTIONS', description: 'Zambian elections' },
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
  // Now matches against Polymarket tag slugs directly (e.g., 'diplomacy-ceasefire', 'trump-iran', 'iranian-leadership-regime')
  // since internal slugs now match Polymarket's URL structure exactly.
  //
  // IMPORTANT: Check order determines priority when events have multiple tags.
  // More specific tags are checked first to ensure correct categorization.
  if (category === 'IRAN') {
    // Exact slug matches - ordered by specificity (most specific first)
    if (tagLower.some(t => t === 'negotiations')) return 'negotiations';
    if (tagLower.some(t => t === 'trump-iran')) return 'trump-iran';
    if (tagLower.some(t => t === 'peace-deal')) return 'peace-deal';
    if (tagLower.some(t => t === 'strait-of-hormuz' || t === 'strait-of-hormuzs')) return 'strait-of-hormuz';
    if (tagLower.some(t => t === 'diplomacy-ceasefire')) return 'diplomacy-ceasefire';
    if (tagLower.some(t => t === 'oil')) return 'oil';
    if (tagLower.some(t => t === 'lebanon')) return 'lebanon';
    if (tagLower.some(t => t === 'nuclear')) return 'nuclear';
    if (tagLower.some(t => t === 'israel-x-iran' || t === 'israel-iran')) return 'israel-x-iran';
    if (tagLower.some(t => t === 'iranian-leadership-regime')) return 'iranian-leadership-regime';

    // Fallback to partial matches for backwards compatibility
    if (tagLower.some(t => t.includes('negotiation'))) return 'negotiations';
    if (tagLower.some(t => t.includes('peace') && t.includes('deal'))) return 'peace-deal';
    if (tagLower.some(t => t.includes('strait') && t.includes('hormuz'))) return 'strait-of-hormuz';
    if (tagLower.some(t => t.includes('ceasefire') || t.includes('cease-fire'))) return 'diplomacy-ceasefire';
    return 'iranian-leadership-regime'; // default
  }

  // POLITICS mappings - aligned with curated list
  // Priority order: more specific tags first to avoid misclassification
  // Events can have multiple tags, so check order determines which subcategory wins
  if (category === 'POLITICS') {
    // Most specific: exact slug matches (these take priority)
    if (tagLower.some(t => t === 'trump-daily' || ((t.includes('trump') || t.includes('donald')) && t.includes('daily')))) return 'trump-daily';
    if (tagLower.some(t => t === 'primaries' || t.includes('primar'))) return 'primaries';
    if (tagLower.some(t => t === 'congress' || t === 'senate' || t === 'house')) return 'congress';
    if (tagLower.some(t => t === 'courts' || t.includes('court') || t.includes('justice') || t.includes('scotus'))) return 'courts';
    if (tagLower.some(t => t === 'cabinet')) return 'trump-cabinet';
    if (tagLower.some(t => t === 'epstein')) return 'epstein';
    if (tagLower.some(t => t === 'gov-shutdown' || t.includes('shutdown') || t.includes('funding'))) return 'gov-shutdown';
    if (tagLower.some(t => t === 'la-mayor' || (t.includes('la') && t.includes('mayor')))) return 'la-mayor';
    if (tagLower.some(t => t === 'german-elections' || (t.includes('german') && t.includes('election')))) return 'german-elections';
    if (tagLower.some(t => t === 'uk-elections' || (t.includes('uk') && t.includes('election')))) return 'uk-elections';
    if (tagLower.some(t => t === 'french-elections' || (t.includes('french') && t.includes('election')))) return 'french-elections';
    if (tagLower.some(t => t === 'mayoral-elections' || t.includes('mayoral'))) return 'mayoral-elections';
    if (tagLower.some(t => t === 'us-presidential-election' || (t.includes('us') && (t.includes('election') || t.includes('presidential'))))) return 'us-presidential-election';
    if (tagLower.some(t => t === 'south-korea' || t.includes('korea'))) return 'south-korea';
    if (tagLower.some(t => t === 'japan')) return 'japan';
    if (tagLower.some(t => t === 'china')) return 'china';
    if (tagLower.some(t => t === 'brazil')) return 'brazil';
    if (tagLower.some(t => t === 'canada')) return 'canada';
    if (tagLower.some(t => t === 'venezuela')) return 'venezuela';
    if (tagLower.some(t => t === 'turkey')) return 'turkey';

    // Broader tags (checked after specific ones)
    if (tagLower.some(t => t === 'midterms' || t.includes('midterm'))) return 'midterms';
    if (tagLower.some(t => t === 'global-elections' || (t.includes('global') && t.includes('election')))) return 'global-elections';
    if (tagLower.some(t => t === 'trump' || t.includes('trump') || t.includes('donald'))) return 'trump';
  }

  // FINANCE mappings - aligned with curated list
  if (category === 'FINANCE') {
    if (tagLower.some(t => t.includes('stock') || t.includes('equity') || t.includes('s&p') || t.includes('nasdaq'))) return 'stocks';
    if (tagLower.some(t => t === 'indicies' || t.includes('index'))) return 'indicies';
    if (tagLower.some(t => t.includes('earning') || t.includes('revenue'))) return 'earnings';
    if (tagLower.some(t => t.includes('commodit'))) return 'commodities';
    if (tagLower.some(t => t.includes('forex') || t.includes('currenc'))) return 'forex';
    if (tagLower.some(t => t.includes('private'))) return 'privates';
    if (tagLower.some(t => t.includes('acquisition') || t.includes('merger') || t.includes('m&a'))) return 'acquisitions';
    if (tagLower.some(t => t === 'ipo' || t.includes('ipo'))) return 'ipo';
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
    // Exact slug matches first
    if (tagLower.some(t => t === 'ufc' || t === 'mma')) return 'ufc';
    if (tagLower.some(t => t === 'soccer' || t === 'football')) return 'soccer';
    if (tagLower.some(t => t === 'tennis')) return 'tennis';
    if (tagLower.some(t => t === 'cricket')) return 'cricket';
    if (tagLower.some(t => t === 'basketball' || t === 'nba' || t === 'wnba')) return 'basketball';
    if (tagLower.some(t => t === 'baseball' || t === 'mlb' || t === 'kbo' || t === 'npb' || t === 'cpbl')) return 'baseball';
    if (tagLower.some(t => t === 'football' || t === 'nfl')) return 'football';
    if (tagLower.some(t => t === 'hockey' || t === 'nhl')) return 'hockey';
    if (tagLower.some(t => t === 'rugby')) return 'rugby';
    if (tagLower.some(t => t === 'table-tennis' || t === 'table tennis')) return 'table-tennis';
    if (tagLower.some(t => t === 'volleyball')) return 'volleyball';
    if (tagLower.some(t => t === 'golf')) return 'golf';
    if (tagLower.some(t => t === 'combat')) return 'combat';
    if (tagLower.some(t => t === 'motorsports' || t.includes('motor'))) return 'motorsports';
    if (tagLower.some(t => t === 'cycling' || t.includes('cycl'))) return 'cycling';
    if (tagLower.some(t => t === 'poker')) return 'poker';
    if (tagLower.some(t => t === 'chess')) return 'chess';
    if (tagLower.some(t => t === 'pickleball')) return 'pickleball';
    if (tagLower.some(t => t === 'lacrosse')) return 'lacrosse';
    if (tagLower.some(t => t === 'esports' || t === 'esport')) return 'esports';
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

  // CULTURE mappings - aligned with curated list
  if (category === 'CULTURE') {
    if (tagLower.some(t => t.includes('art') && !t.includes('mart'))) return 'art';
    if (tagLower.some(t => t.includes('music') || t.includes('song'))) return 'music';
    if (tagLower.some(t => t.includes('celebrit') || t.includes('famous'))) return 'celebrities';
    if (tagLower.some(t => t.includes('award'))) return 'awards';
    if (tagLower.some(t => t.includes('mrbeast') || t.includes('mr beast'))) return 'mrbeast';
    if (tagLower.some(t => t.includes('movie') || t.includes('film'))) return 'movies';
    if (tagLower.some(t => t.includes('taylor') && t.includes('swift'))) return 'taylor-swift';
    if (tagLower.some(t => t.includes('gta'))) return 'gta-vi';
    if (tagLower.some(t => t.includes('twitter') || t.includes('tweet'))) return 'twitter';
    if (tagLower.some(t => t.includes('youtube'))) return 'youtube';
    if (tagLower.some(t => t.includes('reality') && t.includes('tv'))) return 'reality-tv';
    if (tagLower.some(t => t.includes('alien') || t.includes('ufo'))) return 'aliens';
    if (tagLower.some(t => t.includes('eurovision'))) return 'eurovision';
    if (tagLower.some(t => t.includes('court') || t.includes('justice'))) return 'courts';
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

  // GEOPOLITICS mappings - aligned with curated list
  if (category === 'GEOPOLITICS') {
    if (tagLower.some(t => t.includes('iran') || t.includes('iranian'))) return 'iran';
    if (tagLower.some(t => t.includes('lebanon') || t.includes('lebanese'))) return 'lebanon';
    if (tagLower.some(t => t.includes('oil') || t.includes('energy'))) return 'oil';
    if (tagLower.some(t => t.includes('ukraine') || t.includes('ukrainian'))) return 'ukraine';
    if (tagLower.some(t => t.includes('ukraine') && t.includes('map'))) return 'ukraine-map';
    if (tagLower.some(t => t.includes('cuba') || t.includes('cuban'))) return 'cuba';
    if (tagLower.some(t => t.includes('venezuela') || t.includes('venezuelan'))) return 'venezuela';
    if (tagLower.some(t => (t.includes('middle') && t.includes('east')) || t.includes('mideast'))) return 'middle-east';
    if (tagLower.some(t => t.includes('gaza') || t.includes('gazan'))) return 'gaza';
    if (tagLower.some(t => t.includes('israel') || t.includes('israeli'))) return 'israel';
    if (tagLower.some(t => t.includes('syria') || t.includes('syrian'))) return 'syria';
    if (tagLower.some(t => t.includes('yemen') || t.includes('yemeni'))) return 'yemen';
    if (tagLower.some(t => t.includes('turkey') || t.includes('turkish'))) return 'turkey';
    if (tagLower.some(t => t.includes('sudan') || t.includes('sudanese'))) return 'sudan';
    if (tagLower.some(t => t.includes('china') || t.includes('chinese'))) return 'china';
    if (tagLower.some(t => t.includes('india') && t.includes('pakistan'))) return 'india-pakistan';
  }

  // WEATHER mappings - aligned with curated list
  if (category === 'WEATHER') {
    if (tagLower.some(t => t.includes('temperature') || t.includes('temp'))) return 'temperature';
    if (tagLower.some(t => t === 'high-temperature' || t.includes('high') && t.includes('temp'))) return 'high-temperature';
    if (tagLower.some(t => t === 'low-temperature' || t.includes('low') && t.includes('temp'))) return 'low-temperature';
    if (tagLower.some(t => t.includes('precipitation') || t.includes('rain') || t.includes('snow') || t.includes('precip'))) return 'precipitation';
    if (tagLower.some(t => t.includes('global') && t.includes('weather'))) return 'global';
    if (tagLower.some(t => t === 'tornadoes' || t.includes('tornado'))) return 'tornadoes';
    if (tagLower.some(t => t === 'hurricanes' || t.includes('hurricane') || t.includes('typhoon'))) return 'hurricanes';
    if (tagLower.some(t => t === 'earthquakes' || t.includes('earthquake') || t.includes('seismic'))) return 'earthquakes';
    if (tagLower.some(t => t === 'volcanoes' || t.includes('volcano') || t.includes('eruption'))) return 'volcanoes';
    if (tagLower.some(t => t === 'pandemics' || t.includes('pandemic') || t.includes('virus'))) return 'pandemics';
  }

  // ELECTIONS mappings - aligned with curated list
  if (category === 'ELECTIONS') {
    if (tagLower.some(t => t.includes('australia') || t.includes('australian'))) return 'australia';
    if (tagLower.some(t => t.includes('brazil') || t.includes('brazilian'))) return 'brazil';
    if (tagLower.some(t => t.includes('bulgaria') || t.includes('bulgarian'))) return 'bulgaria';
    if (tagLower.some(t => t.includes('canada') || t.includes('canadian'))) return 'canada';
    if (tagLower.some(t => t.includes('estonia') || t.includes('estonian'))) return 'estonia';
    if (tagLower.some(t => t.includes('france') || t.includes('french'))) return 'france';
    if (tagLower.some(t => t.includes('germany') || t.includes('german'))) return 'germany';
    if (tagLower.some(t => t.includes('greece') || t.includes('greek'))) return 'greece';
    if (tagLower.some(t => t.includes('guinea') && t.includes('bissau'))) return 'guinea-bissau';
    if (tagLower.some(t => t.includes('haiti') || t.includes('haitian'))) return 'haiti';
    if (tagLower.some(t => t.includes('hungary') || t.includes('hungarian'))) return 'hungary';
    if (tagLower.some(t => t.includes('india') || t.includes('indian'))) return 'india';
    if (tagLower.some(t => t.includes('israel') || t.includes('israeli'))) return 'israel';
    if (tagLower.some(t => t.includes('kazakhstan') || t.includes('kazakh'))) return 'kazakhstan';
    if (tagLower.some(t => t.includes('latvia') || t.includes('latvian'))) return 'latvia';
    if (tagLower.some(t => t.includes('mexico') || t.includes('mexican'))) return 'mexico';
    if (tagLower.some(t => t.includes('morocco') || t.includes('moroccan'))) return 'morocco';
    if (tagLower.some(t => t.includes('new zealand') || t.includes('nz') || t.includes('new-zealand'))) return 'new-zealand';
    if (tagLower.some(t => t.includes('nigeria') || t.includes('nigerian'))) return 'nigeria';
    if (tagLower.some(t => t.includes('peru') || t.includes('peruvian'))) return 'peru';
    if (tagLower.some(t => t.includes('philippines') || t.includes('philippine'))) return 'philippines';
    if (tagLower.some(t => t.includes('romania') || t.includes('romanian'))) return 'romania';
    if (tagLower.some(t => t.includes('russia') || t.includes('russian'))) return 'russia';
    if (tagLower.some(t => t.includes('serbia') || t.includes('serbian'))) return 'serbia';
    if (tagLower.some(t => t.includes('south africa') || t.includes('south african'))) return 'south-africa';
    if (tagLower.some(t => t.includes('sweden') || t.includes('swedish'))) return 'sweden';
    if (tagLower.some(t => t.includes('switzerland') || t.includes('swiss'))) return 'switzerland';
    if (tagLower.some(t => t.includes('taiwan') || t.includes('taiwanese'))) return 'taiwan';
    if (tagLower.some(t => t.includes('uk') || t.includes('united kingdom') || t.includes('british'))) return 'uk';
    if (tagLower.some(t => t.includes('us') || t.includes('united states') || t.includes('america') || t.includes('american'))) return 'us';
    if (tagLower.some(t => t.includes('zambia') || t.includes('zambian'))) return 'zambia';
  }

  return null; // No subcategory match
}
