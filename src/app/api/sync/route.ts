export const dynamic = 'force-dynamic'
import { syncPolymarketMarkets, checkMarketResolutions } from '@/lib/polymarket';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Optional CRON_SECRET validation for security
  // If CRON_SECRET is set, validate it (recommended for production)
  const cronSecret = process.env.CRON_SECRET
  const providedSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('cron_secret')

  if (cronSecret && providedSecret !== cronSecret) {
    console.error('[Sync] Invalid CRON_SECRET provided')
    return Response.json({
      success: false,
      error: 'Unauthorized'
    }, { status: 401 });
  }

  try {
    console.log('[Sync] Starting Polymarket sync...')
    const result = await syncPolymarketMarkets();

    // Check for resolved markets and trigger scoring
    console.log('[Sync] Checking market resolutions...')
    await checkMarketResolutions();

    console.log('[Sync] Complete', { synced: result.synced, errors: result.errors.length })

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
