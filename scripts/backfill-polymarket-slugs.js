// scripts/backfill-polymarket-slugs.js
// Backfills Market.polymarketSlug from the Polymarket Gamma API by event ID.
// Run: node scripts/backfill-polymarket-slugs.js [--limit=N]
// Skips markets that already have a slug. Safe to re-run.

const path = require('path');
require(path.join(process.cwd(), 'node_modules/dotenv')).config({ path: path.join(process.cwd(), '.env') });
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'));
const prisma = new PrismaClient();

const API = process.env.POLYMARKET_API_BASE || 'https://gamma-api.polymarket.com';
const BATCH = 100;   // markets per DB page
const API_CHUNK = 1; // Gamma /events accepts one id reliably — query per id
const DELAY_MS = 120;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchSlugs(ids) {
  const res = await fetch(`${API}/events?id=${ids.join(',')}`);
  if (!res.ok) throw new Error(`Gamma API ${res.status}`);
  const events = await res.json();
  const map = new Map();
  for (const e of events) {
    if (e.id && e.slug) map.set(String(e.id), e.slug);
  }
  return map;
}

(async () => {
  const argLimit = process.argv.find(a => a.startsWith('--limit='));
  const limit = argLimit ? parseInt(argLimit.split('=')[1], 10) : Infinity;

  let cursor = 0, updated = 0, notFound = 0, scanned = 0;

  while (scanned < limit) {
    const markets = await prisma.market.findMany({
      where: { source: 'POLYMARKET', polymarketSlug: null, polymarketEventId: { not: null } },
      select: { id: true, polymarketEventId: true },
      skip: cursor,
      take: BATCH,
      orderBy: { createdAt: 'asc' },
    });
    if (markets.length === 0) break;

    // Only numeric IDs map to Gamma events
    const valid = markets.filter(m => /^\d+$/.test(m.polymarketEventId));

    for (let i = 0; i < valid.length; i += API_CHUNK) {
      const chunk = valid.slice(i, i + API_CHUNK);
      try {
        const slugMap = await fetchSlugs(chunk.map(m => m.polymarketEventId));
        for (const m of chunk) {
          const slug = slugMap.get(m.polymarketEventId);
          if (slug) {
            await prisma.market.update({ where: { id: m.id }, data: { polymarketSlug: slug } });
            updated++;
          } else {
            notFound++;
          }
        }
      } catch (e) {
        console.error(`API error for chunk starting ${chunk[0].polymarketEventId}:`, e.message);
      }
      await sleep(DELAY_MS);
    }

    scanned += markets.length;
    console.log(`scanned=${scanned} updated=${updated} notFoundOnGamma=${notFound}`);
    cursor += BATCH;
  }

  console.log(`DONE. scanned=${scanned}, slugsBackfilled=${updated}, notFound=${notFound}`);
  await prisma.$disconnect();
})();
