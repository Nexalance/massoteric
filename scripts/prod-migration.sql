-- Production Migration Script
-- Run this in production database BEFORE or AFTER deploying
-- Connect to your production database and execute:

-- Step 1: Add polymarketEventId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Market' AND column_name = 'polymarketEventId'
    ) THEN
        ALTER TABLE "Market" ADD COLUMN "polymarketEventId" TEXT;
    END IF;
END $$;

-- Step 2: Drop unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Market_polymarketEventId_key'
    ) THEN
        ALTER TABLE "Market" DROP CONSTRAINT "Market_polymarketEventId_key";
    END IF;
END $$;

-- Step 3: Create index on polymarketEventId for performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'Market_polymarketEventId_idx'
    ) THEN
        CREATE INDEX "Market_polymarketEventId_idx" ON "Market"("polymarketEventId");
    END IF;
END $$;

-- Step 4: Populate polymarketEventId from externalId (run only once)
UPDATE "Market"
SET "polymarketEventId" = SPLIT_PART("externalId", '-', 1)
WHERE "polymarketEventId" IS NULL
  AND "externalId" IS NOT NULL
  AND "source" = 'POLYMARKET';

-- Verify
SELECT COUNT(*) as total_markets,
       COUNT(CASE WHEN "polymarketEventId" IS NOT NULL THEN 1 END) as with_event_id
FROM "Market"
WHERE "source" = 'POLYMARKET';
