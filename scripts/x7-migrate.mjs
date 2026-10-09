// One-off data migration: old server Postgres -> Supabase (data-only).
// AUTO-DISCOVERY: scans local Postgres clusters (5433/5432) and every database
// on them, picks the one that actually holds User/Prediction data (the app's
// live DB), and migrates all tables from there into Supabase.
// Verification report lands in x7_report (new DB). Success marker: .x7done.
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const HOME = '/home/nexalance-massoteric';
const OVERRIDE_SOURCE = process.argv[2] || ''; // testing only

const newUrl = 'postgresql://massoteric_app.akfpscdidnrpxvmnjuwf:2e67cc278c6daf4f5257e43566939b71@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
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
  // explicit override (testing)
  if (OVERRIDE_SOURCE) {
    const n = (await tryCount(OVERRIDE_SOURCE, 'User')) || 0;
    return { url: OVERRIDE_SOURCE, label: 'override', score: n };
  }
  // .env URL as a candidate too
  const envPath = `${HOME}/htdocs/massoteric.nexalance.com/app/.env`;
  const candidates = new Set();
  try {
    const env = fs.readFileSync(envPath, 'utf8');
    const all = [...env.matchAll(/^DATABASE_URL=(.*)$/gm)].map((m) => m[1].trim().replace(/^["']|["']$/g, ''));
    all.forEach((u) => candidates.add(u));
  } catch {}
  // enumerate every database on the local clusters
  for (const port of [5433, 5432]) {
    for (const user of ['massocratic', 'postgres']) {
      const boot = `postgresql://${user}@127.0.0.1:${port}/postgres`;
      const c = mk(boot);
      try {
        const dbs = await c.$queryRawUnsafe('SELECT datname FROM pg_database WHERE NOT datistemplate');
        for (const d of dbs) candidates.add(`postgresql://${user}@127.0.0.1:${port}/${d.datname}`);
        await c.$disconnect();
        break; // this user+port works; no need to try the other user
      } catch {
        await c.$disconnect().catch(() => {});
      }
    }
  }
  // score each candidate by how much real user data it holds
  let best = null;
  for (const url of candidates) {
    const u = (await tryCount(url, 'User')) ?? -1;
    const p = (await tryCount(url, 'Prediction')) ?? -1;
    const a = (await tryCount(url, 'AccuracyScore')) ?? -1;
    if (u < 0) continue; // schema missing -> not an app DB
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

try {
  await NEW.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "x7_report" (tag text primary key, info text, at timestamptz default now())');
  await report('started', new Date().toISOString());

  const source = await discoverSource();
  if (!source || source.score <= 0) {
    await report('error', 'NO_SOURCE_WITH_USER_DATA_FOUND — scan rows above show what was checked');
    console.error('NO_SOURCE_WITH_USER_DATA_FOUND');
    process.exitCode = 1;
  } else {
    await report('source', `${source.label} (score=${source.score})`);
    const OLD = mk(source.url);
    for (const t of ORDER) {
      const rows = await OLD.$queryRawUnsafe(`SELECT * FROM "${t}"`);
      if (rows.length === 0) { await report(`count: ${t}`, 'old=0'); continue; }
      const meta = await NEW.$queryRawUnsafe(
        `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
        t
      );
      const castOf = {};
      for (const c of meta) castOf[c.column_name] = c.data_type === 'USER-DEFINED' ? `::"${c.udt_name}"` : '';
      let inserted = 0;
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
        await NEW.$executeRawUnsafe(
          `INSERT INTO "${t}" (${colList}) VALUES ${tuples.join(',')} ON CONFLICT DO NOTHING`,
          ...params
        );
        inserted += batch.length;
      }
      await report(`count: ${t}`, `old=${rows.length} new-inserted=${inserted}`);
    }
    await OLD.$disconnect().catch(() => {});
    await report('done', 'node-ok');
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
