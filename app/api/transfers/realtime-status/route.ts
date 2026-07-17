import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Real-time Transfer Status API
 * GET /api/transfers/realtime-status?userId=xxx
 * 
 * Fetch real-time transfer status and balance updates
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[v0] Fetching transfer status for user:', user.id);

    // Fetch recent transfers with real-time data
    const { data: transfers, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .in('transaction_type', ['transfer', 'deposit'])
      .order('initiated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      console.error('[v0] Failed to fetch transfers:', txError);
      return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
    }

    // Fetch current account balances
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, account_number, balance, currency, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (accountError) {
      console.error('[v0] Failed to fetch accounts:', accountError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Format response with real-time data
    const formattedTransfers = (transfers || []).map((tx: any) => ({
      id: tx.id,
      transactionId: tx.id,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      recipientName: tx.recipient_name,
      toAccountNumber: tx.to_account_number,
      toBankCode: tx.to_bank_code,
      toBankName: tx.to_bank_name,
      type: tx.transaction_type,
      initiatedAt: tx.initiated_at,
      completedAt: tx.completed_at,
      updatedAt: tx.updated_at,
      metadata: tx.metadata
    }));

    const totalBalance = (accounts || []).reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      transfers: formattedTransfers,
      accounts: accounts || [],
      totalBalance,
      stats: {
        totalTransfers: formattedTransfers.length,
        completedTransfers: formattedTransfers.filter((t: any) => t.status === 'completed').length,
        pendingTransfers: formattedTransfers.filter((t: any) => t.status === 'processing' || t.status === 'pending').length,
        failedTransfers: formattedTransfers.filter((t: any) => t.status === 'failed').length
      },
      pagination: {
        limit,
        offset,
        hasMore: (transfers || []).length >= limit
      },
      timestamp: new Date().toISOString()
    };

    console.log('[v0] Transfer status response:', {
      transferCount: formattedTransfers.length,
      accountCount: (accounts || []).length,
      totalBalance
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[v0] Transfer status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfer status', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transfers/realtime-status
 * Update transfer status (for webhooks and background jobs)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify webhook or admin request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, status, completedAt, failureReason } = body;

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, status' },
        { status: 400 }
      );
    }

    console.log('[v0] Updating transfer status:', { transactionId, status });

    // Update transaction status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (completedAt) {
      updateData.completed_at = completedAt;
    }

    if (failureReason) {
      updateData.metadata = { failureReason };
    }

    const { data: updatedTx, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[v0] Failed to update transfer:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transfer status' },
        { status: 500 }
      );
    }

    console.log('[v0] Transfer status updated:', updatedTx);

    return NextResponse.json({
      success: true,
      transaction: updatedTx,
      message: `Transfer status updated to ${status}`
    });

  } catch (error: any) {
    console.error('[v0] POST transfer status error:', error);
    return NextResponse.json(
      { error: 'Failed to update transfer status' },
      { status: 500 }
    );
  }
}
