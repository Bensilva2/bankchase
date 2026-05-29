import { NextRequest, NextResponse } from 'next/server';
import { getTransactionState } from '@/lib/transaction-tracker';

/**
 * GET /api/transfers/status
 * 
 * Real-time transaction status polling endpoint
 * Clients poll this endpoint to check transfer progress
 * 
 * Query params:
 * - transactionId: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { 
          error: 'Missing transactionId query parameter',
          example: '/api/transfers/status?transactionId=TXN-1234567890-abc123'
        },
        { status: 400 }
      );
    }

    const state = await getTransactionState(transactionId);

    if (!state) {
      return NextResponse.json(
        { 
          error: 'Transaction not found',
          transactionId 
        },
        { status: 404 }
      );
    }

    // Calculate processing time
    const processingTimeMs = state.updatedAt - state.createdAt;

    return NextResponse.json({
      transactionId: state.transactionId,
      status: state.status,
      amount: state.amount,
      currency: state.currency,
      sender: state.senderId,
      receiver: state.receiverAccount,
      createdAt: new Date(state.createdAt).toISOString(),
      updatedAt: new Date(state.updatedAt).toISOString(),
      processingTimeMs,
      steps: state.steps.map((step) => ({
        step: step.step,
        status: step.status,
        timestamp: new Date(step.timestamp).toISOString(),
        details: step.details,
      })),
      metadata: state.metadata,
    });
  } catch (error) {
    console.error('[StatusAPI] Error fetching transaction status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transfers/status/batch
 * 
 * Fetch multiple transaction statuses in a single request
 * 
 * Query params:
 * - ids: comma-separated transactionIds (required)
 * 
 * Example: /api/transfers/status/batch?ids=TXN-123,TXN-456,TXN-789
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionIds } = body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'transactionIds array required and must not be empty' },
        { status: 400 }
      );
    }

    if (transactionIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 transaction IDs allowed per request' },
        { status: 400 }
      );
    }

    const states = await Promise.all(
      transactionIds.map((id) => getTransactionState(id))
    );

    const transactions = states
      .filter((state) => state !== null)
      .map((state) => ({
        transactionId: state!.transactionId,
        status: state!.status,
        amount: state!.amount,
        currency: state!.currency,
        sender: state!.senderId,
        receiver: state!.receiverAccount,
        updatedAt: new Date(state!.updatedAt).toISOString(),
      }));

    return NextResponse.json({
      total: transactionIds.length,
      found: transactions.length,
      notFound: transactionIds.length - transactions.length,
      transactions,
    });
  } catch (error) {
    console.error('[StatusAPI] Error fetching batch transaction status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
