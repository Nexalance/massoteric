// Dedup script: removes Polymarket clone rows created by the old per-subcategory sync.
// The old sync created one row per matching subcategory with composite externalIds
// ({eventId}-{subcategorySlug}), so the same event appeared multiple times in the
// feed and users' predictions landed on separate clones of the same topic.
//
// The sync now stores ONE row per event (bare externalId = event.id, primary
// subcategory only). This script cleans up the historical clones:
//   1. Group POLYMARKET markets by the true Polymarket event ID
//   2. Keep the bare-externalId row (fallback: oldest row)
//   3. Move predictions/comments from clones onto the kept row
//      (if a user predicted on both, the clone's prediction is deleted to
//       respect the @@unique([userId, marketId]) constraint)
//   4. Delete the clone rows
//
// Usage:
//   node scripts/dedup-polymarket-clones.js           dry run — prints the plan
//   node scripts/dedup-polymarket-clones.js --apply   executes the cleanup

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function main() {
  const markets = await prisma.market.findMany({
    where: { source: 'POLYMARKET' },
    select: {
      id: true,
      externalId: true,
      polymarketEventId: true,
      title: true,
      createdAt: true,
      _count: { select: { predictions: true, comments: true } },
    },
  });

  const groups = new Map();
  for (const m of markets) {
    const key = m.polymarketEventId || m.externalId;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }

  let cloneCount = 0;
  let movedPredictions = 0;
  let movedComments = 0;
  let droppedDuplicatePredictions = 0;

  for (const [eventKey, group] of groups) {
    if (group.length < 2) continue;

    const keep =
      group.find((m) => m.externalId === eventKey) ||
      [...group].sort((a, b) => a.createdAt - b.createdAt)[0];
    const clones = group.filter((m) => m.id !== keep.id);

    for (const clone of clones) {
      const preds = clone._count.predictions;
      const comments = clone._count.comments;

      if (apply) {
        // Move predictions, respecting @@unique([userId, marketId]):
        // if the user already has a prediction on the kept row, drop the clone's.
        const clonePredictions = await prisma.prediction.findMany({
          where: { marketId: clone.id },
          select: { id: true, userId: true },
        });
        for (const pred of clonePredictions) {
          const existing = await prisma.prediction.findFirst({
            where: { userId: pred.userId, marketId: keep.id },
            select: { id: true },
          });
          if (existing) {
            await prisma.prediction.delete({ where: { id: pred.id } });
            droppedDuplicatePredictions++;
          } else {
            await prisma.prediction.update({ where: { id: pred.id }, data: { marketId: keep.id } });
            movedPredictions++;
          }
        }
        await prisma.comment.updateMany({ where: { marketId: clone.id }, data: { marketId: keep.id } });
        await prisma.market.delete({ where: { id: clone.id } });
      }

      cloneCount++;
      movedComments += comments;
      console.log(
        `${apply ? 'DELETED' : 'WOULD DELETE'} clone ${clone.externalId} (${preds} pred, ${comments} comments)` +
          ` -> kept "${keep.externalId}" | ${keep.title.slice(0, 55)}`
      );
    }
  }

  console.log('');
  console.log(
    `${apply ? 'DONE' : 'DRY RUN'}: ${cloneCount} clone rows ${apply ? 'deleted' : 'would be deleted'},` +
      ` ${movedPredictions} predictions ${apply ? 'moved' : 'would move'},` +
      ` ${droppedDuplicatePredictions} duplicate predictions ${apply ? 'removed' : 'would be removed'} (user had one on both clones),` +
      ` ${movedComments} comments ${apply ? 'moved' : 'would move'}.`
  );
  if (!apply) console.log('Run with --apply to execute.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
