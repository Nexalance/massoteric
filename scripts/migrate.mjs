// ──────────────────────────────────────────────────────────────────────────
// Build-time migration runner.
//
// Runs inside `npm run build` (so on every Vercel deploy) BEFORE next build,
// applying DB migrations to the target database.
//
// WHY THIS INSTEAD OF `prisma migrate deploy`?
//   `prisma migrate deploy` needs a DIRECT (non-pooled) database connection,
//   which means an extra env var (DIRECT_DATABASE_URL) in production. This
//   script instead runs migrations through the Prisma *client*, using the very
//   same DATABASE_URL the app already uses successfully — so it works on both
//   pooled (Supabase pooler) and direct connections, with ZERO extra config.
//
// Each entry is IDEMPOTENT: its `check()` reports whether the change is still
// needed, so re-runs (already-migrated DBs) are a safe no-op.
//
// To add a migration: append an object to MIGRATIONS with name / check / run.
// ──────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MIGRATIONS = [
  {
    name: '20260726_rename_macro_to_economy',
    // Still needed only if the "MACRO" enum value exists (not yet renamed).
    check: async () => {
      const rows = await prisma.$queryRaw`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = 'MarketCategory'
      `
      return rows.some((r) => r.enumlabel === 'MACRO')
    },
    // Atomic in PostgreSQL: existing rows update automatically, no data lost.
    run: async () => {
      await prisma.$executeRaw`ALTER TYPE "MarketCategory" RENAME VALUE 'MACRO' TO 'ECONOMY'`
    },
  },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — cannot run migrations')
  }
  console.log('[migrate] running build-time migrations')
  for (const m of MIGRATIONS) {
    try {
      const needed = await m.check()
      if (needed) {
        console.log(`[migrate] applying:   ${m.name}`)
        await m.run()
        console.log(`[migrate] applied:    ${m.name}`)
      } else {
        console.log(`[migrate] up-to-date: ${m.name}`)
      }
    } catch (err) {
      console.error(`[migrate] FAILED:     ${m.name}`, err)
      throw err
    }
  }
  console.log('[migrate] done')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
