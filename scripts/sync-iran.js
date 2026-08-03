// scripts/sync-iran.js
// Re-sync IRAN category markets from Polymarket

const { syncPolymarketMarkets } = require('../src/lib/polymarket');

(async () => {
  console.log('🔄 Syncing IRAN category from Polymarket...');

  const result = await syncPolymarketMarkets('IRAN');

  console.log('\n✅ Sync complete:');
  console.log(`  - Synced: ${result.synced}`);
  console.log(`  - Errors: ${result.errors}`);
  console.log(`  - Total fetched: ${result.totalFetched}`);
  console.log('\n📊 Subcategory counts:');
  for (const [slug, count] of Object.entries(result.subcategoryCounts)) {
    console.log(`  - ${slug}: ${count}`);
  }

  process.exit(0);
})();
