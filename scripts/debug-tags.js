// Debug script to investigate tag mismatches
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
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  const events = await res.json();

  // Get total count
  const countRes = await fetch(`${BASE_URL}/events?${params}&limit=1`);
  const countEvents = await countRes.json();
  const totalCount = countEvents.length > 0 ? 100 : 0; // Approximate

  return { events, count: events.length };
}

async function main() {
  console.log('🔍 Investigating Polymarket tag counts...\n');

  const tags = ['oil', 'lebanon', 'nuclear'];

  for (const tag of tags) {
    try {
      console.log(`\n📌 Tag: ${tag}`);
      const { events, count } = await fetchEventsByTag(tag);
      console.log(`   Fetched: ${count} events`);

      // Show sample events
      console.log('   Sample events:');
      events.slice(0, 3).forEach((e, i) => {
        console.log(`     ${i + 1}. ${e.title?.substring(0, 60)}...`);
        console.log(`        Tags: ${e.tags?.map(t => t.label).join(', ')}`);
      });

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n✅ Investigation complete');
  process.exit(0);
}

main();
