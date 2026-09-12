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

    // --- Migration: add hasSeenLanding column to User table ----------------
    // Adds the hasSeenLanding column with default false if it doesn't exist.
    const columns = (await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'User'
    `) as { column_name: string }[]

    if (!columns.some((c) => c.column_name === 'hasSeenLanding')) {
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "hasSeenLanding" BOOLEAN NOT NULL DEFAULT false
      `
      console.log('[migrate] applied: add User.hasSeenLanding column')
    }

    // --- Migration: add Subcategory table and Market.subcategoryId column ----------------
    // Creates the Subcategory table and adds the subcategoryId foreign key to Market.
    const tables = (await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Subcategory'
    `) as { table_name: string }[]

    if (tables.length === 0) {
      // Create Subcategory table with correct enum type for category
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Subcategory" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "slug" TEXT NOT NULL UNIQUE,
          "label" TEXT NOT NULL,
          "category" "MarketCategory" NOT NULL,
          "description" TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX "Subcategory_category_idx" ON "Subcategory"("category");`)
      await prisma.$executeRawUnsafe(`CREATE INDEX "Subcategory_category_order_idx" ON "Subcategory"("category", "order");`)
      console.log('[migrate] applied: create Subcategory table')
    } else {
      // Table exists - check for missing columns (in case migration was partially applied)
      const subcategoryColumns = (await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'Subcategory'
      `) as { column_name: string; data_type: string }[]

      // Fix category column type if it's TEXT instead of enum
      const categoryCol = subcategoryColumns.find((c) => c.column_name === 'category')
      if (categoryCol && categoryCol.data_type === 'text') {
        // First, drop any indexes on the category column
        await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Subcategory_category_idx";`)
        await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Subcategory_category_order_idx";`)

        // Cast existing values to the enum type and alter the column
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Subcategory"
          ALTER COLUMN "category" TYPE "MarketCategory"
          USING "category"::text::"MarketCategory";
        `)

        // Recreate indexes
        await prisma.$executeRawUnsafe(`CREATE INDEX "Subcategory_category_idx" ON "Subcategory"("category");`)
        await prisma.$executeRawUnsafe(`CREATE INDEX "Subcategory_category_order_idx" ON "Subcategory"("category", "order");`)
        console.log('[migrate] applied: fix Subcategory.category column type to MarketCategory enum')
      }

      // Add missing createdAt column
      if (!subcategoryColumns.some((c) => c.column_name === 'createdAt')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Subcategory" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
        console.log('[migrate] applied: add Subcategory.createdAt column')
      }

      // Add missing updatedAt column
      if (!subcategoryColumns.some((c) => c.column_name === 'updatedAt')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Subcategory" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`)
        console.log('[migrate] applied: add Subcategory.updatedAt column')
      }
    }

    // Add subcategoryId column to Market if it doesn't exist
    const marketColumns = (await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Market'
    `) as { column_name: string }[]

    if (!marketColumns.some((c) => c.column_name === 'subcategoryId')) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Market" ADD COLUMN "subcategoryId" TEXT;`)
      await prisma.$executeRawUnsafe(`CREATE INDEX "Market_subcategoryId_idx" ON "Market"("subcategoryId");`)
      console.log('[migrate] applied: add Market.subcategoryId column')
    }

    // Add foreign key constraint if it doesn't exist
    const constraints = (await prisma.$queryRaw`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'Market' AND constraint_name = 'Market_subcategoryId_Subcategory_id_fk'
    `) as { constraint_name: string }[]

    if (constraints.length === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Market" ADD CONSTRAINT "Market_subcategoryId_Subcategory_id_fk"
        FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `)
      console.log('[migrate] applied: add Market.subcategoryId foreign key')
    }

    // --- Seed: short-horizon binary test topics (client scoring demo) -------
    // The client onboarding needs topics that resolve within the first week so
    // the full predict → resolve → Brier → leaderboard loop is visible. There
    // is no direct prod DB access, so the topics ship as code and are inserted
    // on the first runtime run after deploy. Idempotent by exact title; topics
    // whose prediction window is already inside the 48h lock (or past) are
    // skipped — a seeded topic must still be predictable to be useful.
    const TEST_TOPICS = [
      {
        title: 'Will the Fed cut interest rates at the September 2026 FOMC meeting?',
        description: 'The Federal Open Market Committee meets on September 15-16, 2026 for its scheduled policy meeting. This topic asks whether the committee will announce a cut to the federal funds target range at that meeting. This is a short-horizon binary test topic for community forecasting practice.',
        resolutionCriteria: 'Resolves YES if the FOMC announces a lower federal funds target range in its statement on September 16, 2026, according to the official Federal Reserve press release (federalreserve.gov). Resolves NO if rates are held steady or raised.',
        category: 'ECONOMY' as const,
        closesAt: '2026-09-16T21:00:00Z',
        resolvesAt: '2026-09-16T22:00:00Z',
      },
      {
        title: 'Will it rain in New York City on September 16, 2026?',
        description: 'Short-horizon binary test topic. Asks whether measurable rain falls in Central Park, New York City on September 16, 2026.',
        resolutionCriteria: 'Resolves YES if the National Weather Service records 0.01 inch or more of precipitation at Central Park, NYC on September 16, 2026. Otherwise NO.',
        category: 'WEATHER' as const,
        closesAt: '2026-09-16T04:00:00Z',
        resolvesAt: '2026-09-17T12:00:00Z',
      },
      {
        title: 'Will Bitcoin trade above $90,000 at any point before September 19, 2026?',
        description: 'Short-horizon binary test topic. Asks whether Bitcoin (BTC/USD) touches $90,000 or higher on any major exchange at any time before September 19, 2026.',
        resolutionCriteria: 'Resolves YES if BTC/USD trades at or above $90,000 on Coinbase or another major exchange before September 19, 2026 23:59 UTC. Otherwise NO.',
        category: 'CRYPTO' as const,
        closesAt: '2026-09-18T23:59:00Z',
        resolvesAt: '2026-09-18T23:59:00Z',
      },
      {
        title: 'Will gold (XAU/USD) close above $4,000 per ounce on September 18, 2026?',
        description: 'Short-horizon binary test topic. Asks whether spot gold settles above the $4,000/oz level at the end of the New York trading day on September 18, 2026.',
        resolutionCriteria: 'Resolves YES if XAU/USD spot price is above $4,000.00 at the September 18, 2026 New York market close (5pm ET), per Bloomberg or Reuters pricing. Otherwise NO.',
        category: 'FINANCE' as const,
        closesAt: '2026-09-18T21:00:00Z',
        resolvesAt: '2026-09-18T22:00:00Z',
      },
      {
        title: 'Will a SpaceX Falcon 9 rocket launch before September 19, 2026?',
        description: 'Short-horizon binary test topic. Asks whether SpaceX conducts at least one Falcon 9 orbital rocket launch before September 19, 2026.',
        resolutionCriteria: 'Resolves YES if a SpaceX Falcon 9 launch lifts off at any time before September 19, 2026 23:59 UTC, confirmed by SpaceX or major spaceflight news coverage. Otherwise NO.',
        category: 'TECH' as const,
        closesAt: '2026-09-18T23:00:00Z',
        resolvesAt: '2026-09-18T23:59:00Z',
      },
      {
        title: 'Will Arsenal win a Premier League match played between September 14 and September 19, 2026?',
        description: 'Short-horizon binary test topic. Asks whether Arsenal FC wins any Premier League fixture played in the week September 14-19, 2026.',
        resolutionCriteria: 'Resolves YES if Arsenal wins (in regulation or extra time) any Premier League match played between September 14 and September 19, 2026 inclusive. Draws or losses count as NO.',
        category: 'SPORTS' as const,
        closesAt: '2026-09-19T11:00:00Z',
        resolvesAt: '2026-09-19T12:00:00Z',
      },
    ]

    for (const topic of TEST_TOPICS) {
      try {
        const closesAt = new Date(topic.closesAt)
        if (closesAt.getTime() < Date.now() + 49 * 60 * 60 * 1000) continue // too close to accept predictions — skip
        const exists = await prisma.market.findFirst({
          where: { source: 'USER_CREATED', title: topic.title },
          select: { id: true },
        })
        if (exists) continue
        await prisma.market.create({
          data: {
            source: 'USER_CREATED',
            topicStatus: 'APPROVED',
            status: 'OPEN',
            title: topic.title,
            description: topic.description,
            resolutionCriteria: topic.resolutionCriteria,
            category: topic.category,
            closesAt,
            resolvesAt: new Date(topic.resolvesAt),
            tags: ['test'],
          },
        })
        console.log('[migrate] seeded test topic:', topic.title)
      } catch (err) {
        // One bad topic must never block the migration flag — log and continue.
        console.error('[migrate] seeding test topic failed:', topic.title, err)
      }
    }

    migrated = true
  } catch (err) {
    // Never break the page render or the sync cron. Retry on the next call.
    console.error('[migrate] ensureMigrated failed (will retry next call):', err)
  }
}
