// Debug Lebanon tag slugs
const BASE_URL = 'https://gamma-api.polymarket.com';

async function main() {
  const params = new URLSearchParams({
    limit: '20',
    tag_slug: 'lebanon',
    active: 'true',
    closed: 'false',
    archived: 'false',
  });

  const res = await fetch(`${BASE_URL}/events?${params}`);
  const events = await res.json();

  console.log(`Polymarket Lebanon events: ${events.length}\n`);
  console.log('Events with their tag SLUGS (not labels):\n');

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`${i + 1}. ${event.title?.substring(0, 55)}...`);
    console.log(`   Tag SLUGS: ${event.tags?.map(t => t.slug).join(', ')}`);
    console.log(`   Tag LABELS: ${event.tags?.map(t => t.label).join(', ')}`);
    console.log('');
  }

  process.exit(0);
}

main();
