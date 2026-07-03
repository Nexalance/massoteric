export const dynamic = 'force-dynamic'
import { syncPolymarketMarkets } from '@/lib/polymarket';

export async function GET() {
  try {
    const result = await syncPolymarketMarkets();
    return Response.json({
      success: true,
      synced: result.synced,
      errors: result.errors
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
