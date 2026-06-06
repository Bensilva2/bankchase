import { NextRequest, NextResponse } from 'next/server';
import { PlaidAnalyticsService } from '@/lib/plaid-analytics-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as any).userId || (payload as any).sub;
    const type = request.nextUrl.searchParams.get('type') || 'funnel';
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    let analytics: any;

    switch (type) {
      case 'funnel':
        analytics = await PlaidAnalyticsService.getConversionFunnel(userId);
        break;
      case 'usage':
        analytics = await PlaidAnalyticsService.getUsageMetrics(days);
        break;
      case 'errors':
        analytics = await PlaidAnalyticsService.getTopErrors(userId, 10);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('[v0] Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
