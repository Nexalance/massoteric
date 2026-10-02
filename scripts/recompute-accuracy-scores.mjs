// One-time data repair: rebuild AccuracyScore rows from the predictions table.
//
// Problem: some users have DUPLICATE "overall" (category = null) AccuracyScore
// rows with split/stale counts, so the leaderboard shows e.g. three 100% rows
// for a forecaster who also has incorrect calls. Updates via findFirst land on
// an arbitrary duplicate, so rows drift apart.
//
// This script, per user:
//   1. Reads all SCORED predictions (with market category)
//   2. Recomputes the correct overall + per-category aggregates
//   3. Deletes ALL existing AccuracyScore rows for that user
//   4. Inserts one clean row per (user, category|null)
//
// Safe to run multiple times (idempotent result). Run on the server:
//   node scripts/recompute-accuracy-scores.mjs           (dry run)
//   node scripts/recompute-accuracy-scores.mjs --apply   (write)
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const pct = (brier) => Math.round((1 - brier) * 100);

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  const beforeRows = await prisma.accuracyScore.findMany({
    select: { id: true, userId: true, category: true, scoredPredictions: true, avgBrierScore: true, accuracyPct: true },
  });

  // Group scored predictions by user
  const scored = await prisma.prediction.findMany({
    where: { status: 'SCORED', brierScore: { not: null } },
    select: { userId: true, brierScore: true, market: { select: { category: true } } },
  });

  const byUser = new Map();
  for (const s of scored) {
    if (!byUser.has(s.userId)) byUser.set(s.userId, []);
    byUser.get(s.userId).push(s);
  }

  console.log(`users: ${users.length} | existing accuracy rows: ${beforeRows.length} | users with scored predictions: ${byUser.size}`);
  console.log('--- existing rows per user (duplicates visible here) ---');
  const existingPerUser = {};
  for (const r of beforeRows) {
    existingPerUser[r.userId] = (existingPerUser[r.userId] || 0) + 1;
  }
  for (const [uid, n] of Object.entries(existingPerUser)) {
    if (n > 1) {
      const u = users.find(x => x.id === uid);
      console.log(`  DUPLICATES: ${u?.username || uid} has ${n} rows`);
    }
  }

  if (!APPLY) {
    console.log('\nDRY RUN — showing what would be written. Re-run with --apply to write.');
  }

  let deleted = 0;
  let written = 0;
  const report = [];

  for (const user of users) {
    const preds = byUser.get(user.id) || [];
    const oldRows = beforeRows.filter(r => r.userId === user.id);

    // Desired rows: overall (category null) + one per category present
    const overallPreds = preds;
    const byCat = new Map();
    for (const p of preds) {
      const cat = p.market.category;
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(p);
    }

    const desired = [];
    if (overallPreds.length > 0) {
      const total = overallPreds.reduce((s, p) => s + p.brierScore, 0);
      const avg = total / overallPreds.length;
      desired.push({ category: null, scoredPredictions: overallPreds.length, totalBrierScore: total, avgBrierScore: avg, accuracyPct: pct(avg) });
    }
    for (const [cat, list] of byCat) {
      const total = list.reduce((s, p) => s + p.brierScore, 0);
      const avg = total / list.length;
      desired.push({ category: cat, scoredPredictions: list.length, totalBrierScore: total, avgBrierScore: avg, accuracyPct: pct(avg) });
    }

    const beforeStr = oldRows.map(r => `${r.category || 'overall'}:${r.scoredPredictions}sc/${r.avgBrierScore?.toFixed(3)}`).join(', ') || 'none';
    const afterStr = desired.map(d => `${d.category || 'overall'}:${d.scoredPredictions}sc/${d.avgBrierScore?.toFixed(3)}`).join(', ');
    report.push({ user: user.username || user.id, before: beforeStr, after: afterStr });

    if (!APPLY) continue;

    // Delete all existing rows for this user, then insert clean rows
    const del = await prisma.accuracyScore.deleteMany({ where: { userId: user.id } });
    deleted += del.count;
    for (const d of desired) {
      await prisma.accuracyScore.create({
        data: {
          userId: user.id,
          category: d.category ?? undefined,
          scoredPredictions: d.scoredPredictions,
          totalPredictions: d.scoredPredictions,
          totalBrierScore: d.totalBrierScore,
          avgBrierScore: d.avgBrierScore,
          accuracyPct: d.accuracyPct,
        },
      });
      written++;
    }
  }

  console.log('\n--- per-user plan (dry run) / applied ---');
  for (const r of report) console.log(`${r.user}: ${r.before} → ${r.after}`);
  if (APPLY) console.log(`\nAPPLIED: deleted ${deleted} old rows, wrote ${written} clean rows`);
  else console.log(`\nDRY RUN ONLY — no changes written. Re-run with --apply.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
