export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { syncPolymarketMarkets, syncPolymarketSubcategories, checkMarketResolutions } from '@/lib/polymarket';
import { ensureMigrated } from '@/lib/migrations';
import { NextRequest } from 'next/server';
import { isCategorySupported } from '@/lib/category-compat';
import { waitUntil } from '@vercel/functions';

// In-progress registry — prevents overlapping syncs of the same category
const inProgress = new Set<string>();

// Background sync that keeps running after the HTTP response via waitUntil
// (required on Vercel serverless: post-response setTimeout work is frozen).
// The HTTP response returns instantly so cron/scheduler clients never time
// out on big categories (SPORTS can take minutes).
function runSyncInBackground(selectedCategory: string): Promise<void> {
  if (inProgress.has(selectedCategory)) {
    console.log(`[Sync] ${selectedCategory} already in progress — skipping duplicate trigger`)
    return Promise.resolve()
  }
  inProgress.add(selectedCategory)

  return (async () => {
    try {
      console.log(`[Sync] Background sync starting for category: ${selectedCategory}`)
      const subcatResult = await syncPolymarketSubcategories(selectedCategory);
      const result = await syncPolymarketMarkets(selectedCategory);
      await checkMarketResolutions();
      console.log(`[Sync] Background sync DONE for ${selectedCategory}: synced=${result.synced}, fetched=${result.totalFetched}, subcatsCreated=${subcatResult.created}, errors=${result.errors}`)
    } catch (error) {
      console.error(`[Sync] Background sync FAILED for ${selectedCategory}:`, error)
    } finally {
      inProgress.delete(selectedCategory)
    }
  })()
}

export async function GET(req: NextRequest) {
  try {
    await ensureMigrated();

    // Get required category parameter for selective syncing
    // e.g., /api/sync?category=POLITICS will only sync POLITICS subcategories
    const categoryParam = req.nextUrl.searchParams.get('category');

    // Category is MANDATORY — sync never runs without an explicit category
    if (!categoryParam) {
      return Response.json({
        success: false,
        error: 'No category selected. Sync runs one category at a time — pick a category (e.g., /api/sync?category=POLITICS).',
        availableCategories: Object.values(require('@prisma/client').MarketCategory).join(', '),
      }, { status: 400 });
    }

    // trim() guards against stray spaces sneaking into cron/scheduler commands
    const selectedCategory = categoryParam.trim().toUpperCase();

    // Check if category is supported in this environment (handles enum mismatches)
    if (!isCategorySupported(selectedCategory)) {
      return Response.json({
        success: false,
        error: `Category '${selectedCategory}' is not supported in this environment yet. Available categories: ${Object.values(require('@prisma/client').MarketCategory).join(', ')}`,
      }, { status: 400 });
    }

    // Respond immediately; heavy work happens in the background so the
    // scheduler never sees a timeout even for the largest categories.
    waitUntil(runSyncInBackground(selectedCategory));

    return Response.json({
      success: true,
      category: selectedCategory,
      mode: 'background',
      message: `Sync started for ${selectedCategory}. It runs in the background and completes within a few minutes.`,
    });
  } catch (error) {
    console.error('[Sync] Error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
