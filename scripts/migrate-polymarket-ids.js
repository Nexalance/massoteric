// Migration script to populate polymarketEventId from existing externalId values
// This fixes the view button and duplicate counting issues by ensuring we have
// the true Polymarket event ID stored separately from the composite externalId

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

async function main() {
  console.log('🔄 Starting polymarketEventId migration...\n');

  // Statistics
  let totalProcessed = 0;
  let updated = 0;
  let skippedAlreadySet = 0;
  let skippedNullExternalId = 0;
  let skippedMalformed = 0;
  const errors = [];

  try {
    // Fetch all POLYMARKET markets
    console.log('📊 Fetching all POLYMARKET markets...');
    const markets = await prisma.market.findMany({
      where: {
        source: 'POLYMARKET',
      },
      select: {
        id: true,
        externalId: true,
        polymarketEventId: true,
        title: true,
      },
    });

    totalProcessed = markets.length;
    console.log(`   Found ${totalProcessed} POLYMARKET markets\n`);

    // Process each market
    const updates = [];

    for (const market of markets) {
      // Skip if polymarketEventId is already set
      if (market.polymarketEventId) {
        skippedAlreadySet++;
        if (isVerbose) {
          console.log(`✓ Skipping ${market.id.substring(0, 8)}... - polymarketEventId already set`);
        }
        continue;
      }

      // Skip if externalId is null
      if (!market.externalId) {
        skippedNullExternalId++;
        console.warn(`⚠ Skipping ${market.id.substring(0, 8)}... - externalId is null`);
        continue;
      }

      // Extract base event ID from composite externalId
      // Format: "eventId" for primary, "eventId-subcategorySlug" for duplicates
      const baseEventId = market.externalId.split('-')[0];

      // Validate the extracted ID
      if (!baseEventId || baseEventId.length < 5) {
        skippedMalformed++;
        const msg = `⚠ Skipping ${market.id.substring(0, 8)}... - malformed externalId: "${market.externalId}"`;
        console.warn(msg);
        errors.push({ marketId: market.id, externalId: market.externalId, title: market.title });
        continue;
      }

      // Prepare update
      updates.push({
        id: market.id,
        polymarketEventId: baseEventId,
        externalId: market.externalId,
      });

      if (isVerbose) {
        console.log(`  ${market.id.substring(0, 8)}...: "${market.externalId}" → "${baseEventId}"`);
      }
    }

    // Log summary before applying changes
    console.log('\n📋 Migration Summary:');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   Already set: ${skippedAlreadySet}`);
    console.log(`   Skipped (null externalId): ${skippedNullExternalId}`);
    console.log(`   Skipped (malformed): ${skippedMalformed}`);
    console.log(`   To update: ${updates.length}\n`);

    // Show errors if any
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} markets with malformed externalId:\n`);
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.title?.substring(0, 40)}...`);
        console.log(`      externalId: "${err.externalId}"`);
      });
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more\n`);
      }
    }

    // Apply updates
    if (updates.length > 0) {
      if (isDryRun) {
        console.log('🔍 DRY RUN - No changes will be applied\n');
        console.log('Sample updates (first 5):');
        updates.slice(0, 5).forEach((u, i) => {
          console.log(`   ${i + 1}. Market ${u.id.substring(0, 8)}...: "${u.externalId}" → "${u.polymarketEventId}"`);
        });
        if (updates.length > 5) {
          console.log(`   ... and ${updates.length - 5} more`);
        }
      } else {
        console.log('💾 Applying updates...');

        // Batch updates to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);

          await prisma.$transaction(
            batch.map((update) =>
              prisma.market.update({
                where: { id: update.id },
                data: { polymarketEventId: update.polymarketEventId },
              })
            )
          );

          console.log(`   Updated ${Math.min(i + batchSize, updates.length)}/${updates.length} markets...`);
        }

        updated = updates.length;
        console.log(`\n✅ Successfully updated ${updated} markets!`);
      }
    } else {
      console.log('ℹ️  No updates needed');
    }

    // Verification
    if (!isDryRun && updates.length > 0) {
      console.log('\n🔍 Verifying migration...');
      const remainingNull = await prisma.market.count({
        where: {
          source: 'POLYMARKET',
          polymarketEventId: null,
        },
      });

      if (remainingNull === 0) {
        console.log('✅ All POLYMARKET markets now have polymarketEventId populated!');
      } else {
        console.log(`⚠️ ${remainingNull} POLYMARKET markets still have null polymarketEventId`);
        console.log('   (These may have null or malformed externalId values)');
      }

      // Check for duplicates
      const duplicateCheck = await prisma.$queryRaw`
        SELECT "polymarketEventId", COUNT(*) as count
        FROM "Market"
        WHERE source = 'POLYMARKET'
          AND "polymarketEventId" IS NOT NULL
        GROUP BY "polymarketEventId"
        HAVING COUNT(*) > 1
        LIMIT 5
      `;
      if (duplicateCheck.length > 0) {
        console.log(`\n⚠️ Found ${duplicateCheck.length} polymarketEventId values with duplicates:`);
        duplicateCheck.slice(0, 5).forEach((d) => {
          console.log(`   - ${d.polymarketEventId}: ${d.count} rows`);
        });
      } else {
        console.log('✅ No duplicate polymarketEventId values detected');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✨ Migration complete!\n');

  // Show rollback command if changes were made
  if (!isDryRun && updated > 0) {
    console.log('💡 Rollback command (if needed):');
    console.log('   UPDATE "Market" SET "polymarketEventId" = NULL WHERE source = \'POLYMARKET\';\n');
  }

  process.exit(0);
}

main();
