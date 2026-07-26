// src/lib/migrations.ts
// Runtime database migrations.
//
// WHY THIS EXISTS:
//   The only deploy path is `git push` → Vercel auto-deploy, with NO direct
//   database / server access. Running migrations in the BUILD step is fragile
//   on Vercel (build containers can't reliably reach / alter the DB, and a
//   failure there breaks the whole deploy). So instead we run migrations at
//   APP RUNTIME, through the same DATABASE_URL the app already uses
//   successfully. They are triggered by:
//     • /api/sync  (the vercel.json cron — runs every 5 min)
//     • the Feed page server component (lazy, on first visit after deploy)
//
// Each migration is IDEMPOTENT and guarded, so re-runs are safe no-ops.
// `migrated` is per serverless instance: the first call checks/applies, then
// later calls in the same instance skip instantly. Failures never throw — they
// just log and leave `migrated` false so the next call retries.

import { prisma } from '@/lib/prisma'

let migrated = false

export async function ensureMigrated() {
  if (migrated) return
  try {
    // --- Migration: rename MarketCategory enum value MACRO -> ECONOMY -------
    // Only applies if the old "MACRO" value still exists. Atomic in PostgreSQL:
    // existing rows update automatically, no data lost.
    const rows = (await prisma.$queryRaw`
      SELECT e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'MarketCategory'
    `) as { enumlabel: string }[]

    if (rows.some((r) => r.enumlabel === 'MACRO')) {
      await prisma.$executeRaw`ALTER TYPE "MarketCategory" RENAME VALUE 'MACRO' TO 'ECONOMY'`
      console.log('[migrate] applied: rename MarketCategory MACRO -> ECONOMY')
    }

    migrated = true
  } catch (err) {
    // Never break the page render or the sync cron. Retry on the next call.
    console.error('[migrate] ensureMigrated failed (will retry next call):', err)
  }
}
