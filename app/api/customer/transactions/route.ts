import { NextRequest, NextResponse } from 'next/server';
import { getUserTransactions, recordTransaction, getTransactionsByStatus } from '@/lib/mongodb/operations';
import { checkMongoHealth } from '@/lib/mongodb/client';

/**
 * GET /api/customer/transactions
 * Get user's transactions from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    const mongoHealth = await checkMongoHealth();
    if (!mongoHealth) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');
    const status = request.nextUrl.searchParams.get('status');

    let transactions;
    if (status) {
      transactions = await getTransactionsByStatus(userId, status);
    } else {
      transactions = await getUserTransactions(userId, Math.min(limit, 100), offset);
    }

    // Calculate summary
    const completed = transactions.filter((t) => t.status === 'completed');
    const totalDebit = completed
      .filter((t) => t.type === 'debit' || t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = completed
      .filter((t) => t.type === 'credit' || t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      data: transactions,
      meta: {
        total: transactions.length,
        totalDebit,
        totalCredit,
        netFlow: totalCredit - totalDebit,
      },
    });
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer/transactions
 * Record a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transactionData = await request.json();

    // Validate required fields
    if (!transactionData.accountId || !transactionData.type || transactionData.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record transaction
    const transactionId = await recordTransaction(userId, {
      ...transactionData,
      status: transactionData.status || 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        transactionId,
        message: 'Transaction recorded',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Error recording transaction:', error);
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
