export const dynamic = 'force-dynamic'
import { syncPolymarketMarkets, syncPolymarketSubcategories, checkMarketResolutions } from '@/lib/polymarket';
import { ensureMigrated } from '@/lib/migrations';
import { NextRequest } from 'next/server';
import { isCategorySupported } from '@/lib/category-compat';

export async function GET(req: NextRequest) {
  try {
    await ensureMigrated();

    // Get optional category parameter for selective syncing
    // e.g., /api/sync?category=POLITICS will only sync POLITICS subcategories
    const categoryParam = req.nextUrl.searchParams.get('category');
    const selectedCategory = categoryParam ? categoryParam.toUpperCase() : null;

    // Check if category is supported in this environment (handles enum mismatches)
    if (selectedCategory && !isCategorySupported(selectedCategory)) {
      return Response.json({
        success: false,
        error: `Category '${selectedCategory}' is not supported in this environment yet. Available categories: ${Object.values(require('@prisma/client').MarketCategory).join(', ')}`,
      }, { status: 400 });
    }

    console.log(`[Sync] Starting sync${selectedCategory ? ` for category: ${selectedCategory}` : ' (all categories)'}`)

    // Sync subcategories first (creates new ones if needed)
    // Pass category filter to only sync subcategories for that category
    const subcatResult = await syncPolymarketSubcategories(selectedCategory);

    // Then sync markets (now can use new subcategories)
    const result = await syncPolymarketMarkets(selectedCategory);

    // Check for resolved markets and trigger scoring
    await checkMarketResolutions();

    return Response.json({
      success: true,
      category: selectedCategory || 'ALL',
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
