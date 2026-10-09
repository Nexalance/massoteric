// One-off data migration: old server Postgres -> Supabase (data-only).
// Reads old DATABASE_URL from the app .env, streams every table across,
// writes a verification report into x7_report on the new DB.
// Success marker: /home/nexalance-massoteric/.x7done (written only on success).
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const OLD_URL_OVERRIDE = process.argv[2] || ''; // testing only
const HOME = '/home/nexalance-massoteric';

const envPath = `${HOME}/htdocs/massoteric.nexalance.com/app/.env`;
let oldUrl = OLD_URL_OVERRIDE;
if (!oldUrl) {
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  oldUrl = m[1].trim().replace(/^["']|["']$/g, '');
}
const newUrl = 'postgresql://massoteric_app.akfpscdidnrpxvmnjuwf:2e67cc278c6daf4f5257e43566939b71@aws-0-us-east-1.pooler.supabase.com:5432/postgres';

const OLD = new PrismaClient({ datasources: { db: { url: oldUrl } } });
const NEW = new PrismaClient({ datasources: { db: { url: newUrl } } });

// FK-safe order: parents before children.
const ORDER = [
  'User', 'Subcategory', 'FeatureFlag', 'Competition', 'CreatorSettings',
  'WaitlistEntry', 'MagicLink', 'Market', 'Prediction', 'PredictionEdit',
  'AccuracyScore', 'Comment', 'CommentVote', 'Payout', 'UserSubscription', 'PlatformSubscription',
];

async function report(tag, info) {
  await NEW.$executeRawUnsafe(
    'INSERT INTO "x7_report" (tag,info) VALUES ($1,$2) ON CONFLICT (tag) DO UPDATE SET info=EXCLUDED.info, at=now()',
    tag, info
  );
}

try {
  await NEW.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "x7_report" (tag text primary key, info text, at timestamptz default now())');
  await report('started', new Date().toISOString());

  for (const t of ORDER) {
    const rows = await OLD.$queryRawUnsafe(`SELECT * FROM "${t}"`);
    if (rows.length === 0) { await report(`count: ${t}`, 'old=0'); continue; }
    const meta = await NEW.$queryRawUnsafe(
      `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
      t
    );
    const castOf = {};
    for (const c of meta) {
      castOf[c.column_name] = c.data_type === 'USER-DEFINED' ? `::"${c.udt_name}"` : '';
    }
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
  await report('done', 'node-ok');
  fs.writeFileSync(`${HOME}/.x7done`, 'ok');
  console.log('MIGRATION_OK');
} catch (e) {
  try { await report('error', String(e && e.message ? e.message : e).slice(0, 1900)); } catch {}
  console.error('MIGRATION_FAIL', e);
  process.exitCode = 1;
} finally {
  await OLD.$disconnect().catch(() => {});
  await NEW.$disconnect().catch(() => {});
}
