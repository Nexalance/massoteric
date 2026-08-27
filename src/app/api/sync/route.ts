export const dynamic = 'force-dynamic'

// Allow up to 5 minutes on Vercel Pro (Hobby plan caps at 60s) — big categories
// like SPORTS sync thousands of markets and can exceed 90s.
export const maxDuration = 300

import { syncPolymarketMarkets, syncPolymarketSubcategories, checkMarketResolutions } from '@/lib/polymarket';
import { ensureMigrated } from '@/lib/migrations';
import { NextRequest } from 'next/server';
import { isCategorySupported } from '@/lib/category-compat';

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

    const selectedCategory = categoryParam.toUpperCase();

    // Check if category is supported in this environment (handles enum mismatches)
    if (!isCategorySupported(selectedCategory)) {
      return Response.json({
        success: false,
        error: `Category '${selectedCategory}' is not supported in this environment yet. Available categories: ${Object.values(require('@prisma/client').MarketCategory).join(', ')}`,
      }, { status: 400 });
    }

    console.log(`[Sync] Starting sync for category: ${selectedCategory}`)

    // Sync subcategories first (creates new ones if needed)
    // Pass category filter to only sync subcategories for that category
    const subcatResult = await syncPolymarketSubcategories(selectedCategory);

    // Then sync markets (now can use new subcategories)
    const result = await syncPolymarketMarkets(selectedCategory);

    // Check for resolved markets and trigger scoring
    await checkMarketResolutions();

    return Response.json({
      success: true,
      category: selectedCategory,
      subcategories: {
        created: subcatResult.created,
        updated: subcatResult.updated,
        deleted: subcatResult.deleted || 0,
      },
      synced: result.synced,
      totalFetched: result.totalFetched,
      errors: result.errors,
      subcategoryCounts: result.subcategoryCounts
    });
  } catch (error) {
    console.error('[Sync] Error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
