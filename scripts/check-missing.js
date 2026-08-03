// Check which events are being missed for oil/lebanon/nuclear
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const BASE_URL = 'https://gamma-api.polymarket.com';

async function fetchEventsByTag(tagSlug) {
  const params = new URLSearchParams({
    limit: '100',
    offset: '0',
    active: 'true',
    closed: 'false',
    archived: 'false',
    order: 'volume',
    ascending: 'false',
    tag_slug: tagSlug,
  });

  const res = await fetch(`${BASE_URL}/events?${params}`);
  const events = await res.json();
  return events;
}

async function main() {
  console.log('🔍 Checking why events are missed...\n');

  const tags = ['oil', 'lebanon', 'nuclear'];

  for (const tagSlug of tags) {
    console.log(`\n📌 Tag: ${tagSlug}`);

    // Fetch Polymarket events
    const polyEvents = await fetchEventsByTag(tagSlug);
    console.log(`   Polymarket events: ${polyEvents.length}`);

    // Get our synced markets for this subcategory
    const subcat = await prisma.subcategory.findUnique({
      where: { slug_category: { slug: tagSlug, category: 'IRAN' } },
      select: { id: true }
    });

    if (!subcat) {
      console.log(`   ❌ Subcategory not found in DB`);
      continue;
    }

    const ourMarkets = await prisma.market.findMany({
      where: {
        subcategoryId: subcat.id,
        source: 'POLYMARKET'
      },
      select: { externalId: true, title: true }
    });

    console.log(`   Our synced markets: ${ourMarkets.length}`);

    // Find missing events
    const ourIds = new Set(ourMarkets.map(m => m.externalId));
    const missingEvents = polyEvents.filter(e => !ourIds.has(e.id));

    if (missingEvents.length > 0) {
      console.log(`   ❌ Missing ${missingEvents.length} events:`);
      missingEvents.slice(0, 5).forEach((e, i) => {
        console.log(`      ${i + 1}. ${e.title?.substring(0, 50)}...`);
        console.log(`         Tags: ${e.tags?.map(t => t.label).join(', ')}`);
      });
      if (missingEvents.length > 5) {
        console.log(`      ... and ${missingEvents.length - 5} more`);
      }

      // Check what subcategory these missing events WERE assigned to
      console.log(`   🔍 Checking where missing events were categorized...`);
      for (const event of missingEvents.slice(0, 3)) {
        const market = await prisma.market.findFirst({
          where: { externalId: event.id },
          include: { subcategory: true }
        });
        if (market) {
          console.log(`      "${event.title?.substring(0, 40)}..."`);
          console.log(`         → Categorized as: ${market.subcategory?.slug || 'None'}`);
        } else {
          console.log(`      "${event.title?.substring(0, 40)}..."`);
          console.log(`         → Not in database at all`);
        }
      }
    } else {
      console.log(`   ✅ All events accounted for`);
    }
  }

  await prisma.$disconnect();
  process.exit(0);
}

main();
