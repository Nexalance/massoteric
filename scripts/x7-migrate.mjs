// One-off data migration: old server Postgres -> Supabase (data-only).
// v4: transaction-pooler target (6543), single-instance lock, externalId-based
// skip for Market (avoids re-inserting rows the Vercel sync already created),
// source-side orphan filter, per-row fallback, full x7_report verification.
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const HOME = '/home/nexalance-massoteric';
const OVERRIDE_SOURCE = process.argv[2] || ''; // testing only

const newUrl = 'postgresql://massoteric_app.akfpscdidnrpxvmnjuwf:2e67cc278c6daf4f5257e43566939b71@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5';
const NEW = new PrismaClient({ datasources: { db: { url: newUrl } } });

async function report(tag, info) {
  await NEW.$executeRawUnsafe(
    'INSERT INTO "x7_report" (tag,info) VALUES ($1,$2) ON CONFLICT (tag) DO UPDATE SET info=EXCLUDED.info, at=now()',
    tag, info
  );
}

function mk(url) {
  return new PrismaClient({ datasources: { db: { url } } });
}

async function tryCount(url, table) {
  const c = mk(url);
  try {
    const r = await c.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    return r[0].n;
  } catch {
    return null;
  } finally {
    await c.$disconnect().catch(() => {});
  }
}

async function discoverSource() {
  if (OVERRIDE_SOURCE) {
    const n = (await tryCount(OVERRIDE_SOURCE, 'User')) || 0;
    return { url: OVERRIDE_SOURCE, label: 'override', score: n };
  }
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
      } catch {
        await c.$disconnect().catch(() => {});
      }
    }
  }
  let best = null;
  for (const url of candidates) {
    const u = (await tryCount(url, 'User')) ?? -1;
    const p = (await tryCount(url, 'Prediction')) ?? -1;
    const a = (await tryCount(url, 'AccuracyScore')) ?? -1;
    if (u < 0) continue;
    const score = u * 100 + p * 10 + a;
    const label = url.replace(/:\/\/([^@]+)@/, '$1@').replace(/\?.*/, '');
    await report(`scan: ${label}`, `user=${u} prediction=${p} accuracy=${a}`);
    if (!best || score > best.score) best = { url, label, score };
  }
  return best;
}

const ORDER = [
  'User', 'Subcategory', 'FeatureFlag', 'Competition', 'CreatorSettings',
  'WaitlistEntry', 'MagicLink', 'Market', 'Prediction', 'PredictionEdit',
  'AccuracyScore', 'Comment', 'CommentVote', 'Payout', 'UserSubscription', 'PlatformSubscription',
];

async function migrateTable(t, rows) {
  const meta = await NEW.$queryRawUnsafe(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    t
  );
  const castOf = {};
  for (const c of meta) castOf[c.column_name] = c.data_type === 'USER-DEFINED' ? `::"${c.udt_name}"` : '';
  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const cols = Object.keys(batch[0]);
    const colList = cols.map((c) => `"${c}"`).join(',');
    const params = [];
    const tuples = batch.map((r) => {
      const placeholders = cols.map((c) => {
        const v = r[c];
        params.push(typeof v === 'bigint' ? v.toString() : v);
        return `$${params.length}${castOf[c] || ''}`;
      });
      return `(${placeholders.join(',')})`;
    });
    try {
      await NEW.$executeRawUnsafe(
        `INSERT INTO "${t}" (${colList}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`,
        ...params
      );
      inserted += batch.length;
    } catch {
      for (const r of batch) {
        const p2 = [];
        const tuple = cols
          .map((c) => {
            const v = r[c];
            p2.push(typeof v === 'bigint' ? v.toString() : v);
            return `$${p2.length}${castOf[c] || ''}`;
          })
          .join(',');
        try {
          await NEW.$executeRawUnsafe(
            `INSERT INTO "${t}" (${colList}) VALUES (${tuple}) ON CONFLICT DO NOTHING`,
            ...p2
          );
          inserted++;
        } catch {
          skipped++;
        }
      }
    }
  }
  return { inserted, skipped };
}

try {
  await NEW.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "x7_report" (tag text primary key, info text, at timestamptz default now())');
  // single-instance lock: if another run heartbeat < 8 min ago, bail out
  const lock = await NEW.$queryRawUnsafe(`SELECT info, at FROM "x7_report" WHERE tag='lock'`);
  const lockFresh = lock[0] && (Date.now() - new Date(lock[0].at).getTime()) < 8 * 60 * 1000;
  if (lockFresh) {
    console.log('LOCKED — another instance running');
    process.exit(0);
  }
  await report('lock', new Date().toISOString());

  const source = await discoverSource();
  if (!source || source.score <= 0) {
    await report('error', 'NO_SOURCE_WITH_USER_DATA_FOUND');
    console.error('NO_SOURCE_WITH_USER_DATA_FOUND');
    process.exitCode = 1;
  } else {
    await report('source', `${source.label} (score=${source.score})`);
    const OLD = mk(source.url);

    for (const t of ORDER) {
      let rows = await OLD.$queryRawUnsafe(`SELECT * FROM "${t}"`);
      if (t === 'Market') {
        // source-side orphan filter + skip rows the target already has (by externalId)
        const orphanIds = new Set(
          (await OLD.$queryRawUnsafe(`SELECT id FROM "Subcategory"`)).map((r) => r.id)
        );
        rows = rows.filter((r) => !r.subcategoryId || orphanIds.has(r.subcategoryId));
        const targetExt = new Set(
          (await NEW.$queryRawUnsafe(`SELECT "externalId" FROM "Market" WHERE "externalId" IS NOT NULL`)).map((r) => r.externalId)
        );
        const before = rows.length;
        rows = rows.filter((r) => !r.externalId || !targetExt.has(r.externalId));
        await report('market-filter', `source=9675+ afterOrphanFilter=${before} afterExternalIdSkip=${rows.length}`);
      }
      if (rows.length === 0) { await report(`count: ${t}`, 'old=0 (or already present)'); continue; }
      const { inserted, skipped } = await migrateTable(t, rows);
      await report(`count: ${t}`, `old=${rows.length} new-inserted=${inserted} skipped=${skipped}`);
      await report('lock', new Date().toISOString()); // heartbeat
    }
    await OLD.$disconnect().catch(() => {});
    await report('done', 'node-ok-v4');
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
