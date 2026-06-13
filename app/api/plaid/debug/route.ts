import { NextRequest, NextResponse } from 'next/server';
import { PlaidDebugService } from '@/lib/plaid-debug-service';

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

    const itemId = request.nextUrl.searchParams.get('itemId');
    const action = request.nextUrl.searchParams.get('action') || 'health';

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (action) {
      case 'health':
        result = await PlaidDebugService.getItemHealthReport(itemId);
        break;
      case 'webhook-history':
        result = await PlaidDebugService.getWebhookHistory(itemId);
        break;
      case 'error-trends':
        const userId = (payload as any).userId || (payload as any).sub;
        const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
        result = await PlaidDebugService.getErrorTrends(userId, days);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid debug action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[v0] Error in debug endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug item' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { accessToken, action, webhookCode } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    let result: any;

    switch (action) {
      case 'simulate-webhook':
        if (!webhookCode) {
          return NextResponse.json(
            { error: 'webhookCode is required' },
            { status: 400 }
          );
        }
        result = await PlaidDebugService.simulateWebhook(accessToken, webhookCode);
        break;
      case 'force-sync':
        result = await PlaidDebugService.forceTransactionSync(accessToken);
        break;
      case 'debug-item':
        result = await PlaidDebugService.debugItem(accessToken);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid debug action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[v0] Error in debug POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute debug action' },
      { status: 500 }
    );
  }
}
