export const dynamic = 'force-dynamic'
import { syncPolymarketMarkets, syncPolymarketSubcategories, checkMarketResolutions } from '@/lib/polymarket';
import { ensureMigrated } from '@/lib/migrations';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await ensureMigrated();

    // Sync subcategories first (creates new ones if needed)
    const subcatResult = await syncPolymarketSubcategories();

    // Then sync markets (now can use new subcategories)
    const result = await syncPolymarketMarkets();

    // Check for resolved markets and trigger scoring
    await checkMarketResolutions();

    return Response.json({
      success: true,
      subcategories: {
        created: subcatResult.created,
        updated: subcatResult.updated,
        deleted: subcatResult.deleted || 0,
      },
      synced: result.synced,
      errors: result.errors,
      iranSynced: result.iranSynced || 0
    });
  } catch (error) {
    console.error('[Sync] Error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
