// One-off data migration v5: migrate ONLY the small user-data tables
// (users, predictions, scores, comments...) + the markets they reference.
// Markets themselves are NOT bulk-migrated — Vercel crons sync them live
// from Polymarket (authoritative source). Completes in seconds, no timeouts.
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const HOME = '/home/nexalance-massoteric';

const newUrl = 'postgresql://massoteric_app.akfpscdidnrpxvmnjuwf:2e67cc278c6daf4f5257e43566939b71@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5';
const NEW = new PrismaClient({ datasources: { db: { url: newUrl } } });

async function report(tag, info) {
  await NEW.$executeRawUnsafe(
    'INSERT INTO "x7_report" (tag,info) VALUES ($1,$2) ON CONFLICT (tag) DO UPDATE SET info=EXCLUDED.info, at=now()',
    tag, info
  );
}
function mk(url) { return new PrismaClient({ datasources: { db: { url } } }); }

async function tryCount(url, table) {
  const c = mk(url);
  try { const r = await c.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`); return r[0].n; }
  catch { return null; }
  finally { await c.$disconnect().catch(() => {}); }
}

async function discoverSource() {
  const envPath = `${HOME}/htdocs/massoteric.nexalance.com/app/.env`;
  const candidates = new Set();
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    [...env.matchAll(/^DATABASE_URL=(.*)$/gm)].forEach((m) => candidates.add(m[1].trim().replace(/^["']|["']$/g, '')));
  } catch {}
  for (const port of [5433, 5432]) {
    for (const user of ['massocratic', 'postgres']) {
      const c = mk(`postgresql://${user}@127.0.0.1:${port}/postgres`);
      try {
        const dbs = await c.$queryRawUnsafe('SELECT datname FROM pg_database WHERE NOT datistemplate');
        for (const d of dbs) candidates.add(`postgresql://${user}@127.0.0.1:${port}/${d.datname}`);
        await c.$disconnect();
        break;
      } catch { await c.$disconnect().catch(() => {}); }
    }
  }
  let best = null;
  for (const url of candidates) {
    const u = (await tryCount(url, 'User')) ?? -1;
    if (u < 0) continue;
    const p = (await tryCount(url, 'Prediction')) ?? -1;
    const score = u * 100 + p * 10;
    if (!best || score > best.score) best = { url, score };
  }
  return best;
}

// small tables only; Market handled specially (only prediction-referenced rows)
const ORDER = [
  'User', 'Subcategory', 'FeatureFlag', 'Competition', 'CreatorSettings',
  'WaitlistEntry', 'MagicLink', 'Prediction', 'PredictionEdit',
  'AccuracyScore', 'Comment', 'CommentVote', 'Payout', 'UserSubscription', 'PlatformSubscription',
];

async function migrateTable(t, rows, castOf) {
  let inserted = 0, skipped = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const cols = Object.keys(batch[0]);
    const colList = cols.map((c) => `"${c}"`).join(',');
    const params = [];
    const tuples = batch.map((r) => {
      const ph = cols.map((c) => { const v = r[c]; params.push(typeof v === 'bigint' ? v.toString() : v); return `$${params.length}${castOf[c] || ''}`; });
      return `(${ph.join(',')})`;
    });
    try {
      await NEW.$executeRawUnsafe(`INSERT INTO "${t}" (${colList}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`, ...params);
      inserted += batch.length;
    } catch {
      for (const r of batch) {
        const p2 = [];
        const tuple = cols.map((c) => { const v = r[c]; p2.push(typeof v === 'bigint' ? v.toString() : v); return `$${p2.length}${castOf[c] || ''}`; }).join(',');
        try {
          await NEW.$executeRawUnsafe(`INSERT INTO "${t}" (${colList}) VALUES (${tuple}) ON CONFLICT DO NOTHING`, ...p2);
          inserted++;
        } catch { skipped++; }
      }
    }
  }
  return { inserted, skipped };
}

async function castMapFor(t) {
  const meta = await NEW.$queryRawUnsafe(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, t
  );
  const castOf = {};
  for (const c of meta) castOf[c.column_name] = c.data_type === 'USER-DEFINED' ? `::"${c.udt_name}"` : '';
  return castOf;
}

try {
  await NEW.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "x7_report" (tag text primary key, info text, at timestamptz default now())');
  const lock = await NEW.$queryRawUnsafe(`SELECT at FROM "x7_report" WHERE tag='lock'`);
  if (lock[0] && Date.now() - new Date(lock[0].at).getTime() < 5 * 60 * 1000) {
    console.log('LOCKED');
    process.exit(0);
  }
  await report('lock', new Date().toISOString());

  const source = await discoverSource();
  if (!source || source.score <= 0) {
    await report('error', 'NO_SOURCE_WITH_USER_DATA_FOUND');
    console.error('NO_SOURCE_WITH_USER_DATA_FOUND');
    process.exitCode = 1;
  } else {
    await report('source', `${source.url.replace(/:[^@/]*@/, ':***@')} (score=${source.score})`);
    const OLD = mk(source.url);

    // 1) markets referenced by predictions (small, FK-required)
    const refMarketIds = (await OLD.$queryRawUnsafe(`SELECT DISTINCT "marketId" FROM "Prediction"`)).map((r) => r.marketId);
    await report('pred-markets', `referenced=${refMarketIds.length}`);
    const castOfMarket = await castMapFor('Market');
    let mInserted = 0, mSkipped = 0;
    for (const mid of refMarketIds) {
      const rows = await OLD.$queryRawUnsafe(`SELECT * FROM "Market" WHERE id=$1`, mid);
      if (!rows.length) { mSkipped++; continue; }
      const { inserted, skipped } = await migrateTable('Market', rows, castOfMarket);
      mInserted += inserted; mSkipped += skipped;
    }
    await report(`count: Market`, `referenced-inserted=${mInserted} missing=${mSkipped} (rest: vercel sync covers)`);

    // 2) small user-data tables
    for (const t of ORDER) {
      const rows = await OLD.$queryRawUnsafe(`SELECT * FROM "${t}"`);
      if (rows.length === 0) { await report(`count: ${t}`, 'old=0'); continue; }
      const castOf = await castMapFor(t);
      const { inserted, skipped } = await migrateTable(t, rows, castOf);
      await report(`count: ${t}`, `old=${rows.length} new-inserted=${inserted} skipped=${skipped}`);
      await report('lock', new Date().toISOString());
    }
    await OLD.$disconnect().catch(() => {});
    await report('done', 'node-ok-v5');
    fs.writeFileSync(`${HOME}/.x7done`, 'ok');
    console.log('MIGRATION_OK');
  }
} catch (e) {
  try { await report('error', String(e && e.message ? e.message : e).slice(0, 1900)); } catch {}
  console.error('MIGRATION_FAIL', e);
  process.exitCode = 1;
} finally {
  await NEW.$disconnect().catch(() => {});
}
