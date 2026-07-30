export const dynamic = 'force-dynamic'
import { syncPolymarketMarkets, checkMarketResolutions } from '@/lib/polymarket';
import { ensureMigrated } from '@/lib/migrations';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await ensureMigrated();

    const result = await syncPolymarketMarkets();

    // Check for resolved markets and trigger scoring
    await checkMarketResolutions();

    return Response.json({
      success: true,
      synced: result.synced,
      errors: result.errors
    });
  } catch (error) {
    console.error('[Sync] Error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
