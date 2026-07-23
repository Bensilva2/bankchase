import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Balance Update Webhook
 * POST /api/webhooks/balance-updates
 * 
 * Receives balance update events from external services or internal systems
 * Processes and broadcasts real-time balance updates to connected clients
 */

interface BalanceUpdateEvent {
  timestamp: string;
  userId: string;
  accountId: string;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  transactionId?: string;
  reason: string;
  metadata?: Record<string, any>;
}

// In-memory store for connected clients (for WebSocket-like updates)
const balanceUpdateSubscribers = new Map<string, Set<any>>();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify webhook signature (in production, validate with webhook secret)
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.warn('[v0] Missing webhook headers');
      // Allow in development, reject in production
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
      }
    }

    const body = await request.json() as BalanceUpdateEvent;
    const { userId, accountId, previousBalance, newBalance, changeAmount, reason, transactionId, metadata } = body;

    console.log('[v0] Balance update webhook received:', {
      userId,
      accountId,
      changeAmount,
      reason,
      timestamp: body.timestamp
    });

    // Validate payload
    if (!userId || !accountId || newBalance === undefined || changeAmount === undefined || !reason) {
      console.error('[v0] Invalid balance update payload:', body);
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 }
      );
    }

    // Update balance in database
    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[v0] Failed to update balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    console.log('[v0] Balance updated successfully:', {
      accountId,
      previousBalance,
      newBalance,
      changeAmount
    });

    // Create balance update log entry
    const { error: logError } = await supabase
      .from('balance_updates')
      .insert({
        user_id: userId,
        account_id: accountId,
        previous_balance: previousBalance,
        new_balance: newBalance,
        change_amount: changeAmount,
        transaction_id: transactionId,
        reason,
        metadata,
        webhook_received_at: new Date().toISOString()
      });

    if (logError) {
      console.warn('[v0] Failed to log balance update:', logError);
      // Don't fail the webhook if logging fails
    }

    // Broadcast update to subscribed clients
    broadcastBalanceUpdate(userId, {
      accountId,
      previousBalance,
      newBalance,
      changeAmount,
      reason,
      timestamp: body.timestamp,
      updatedAccount
    });

    return NextResponse.json({
      success: true,
      message: 'Balance update processed',
      account: updatedAccount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[v0] Balance webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process balance update',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/balance-updates
 * Subscribe to real-time balance updates (SSE - Server-Sent Events)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    console.log('[v0] Client subscribing to balance updates:', userId);

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        controller.enqueue(`:balance-update-stream-started\n\n`);

        // Store subscriber
        if (!balanceUpdateSubscribers.has(userId)) {
          balanceUpdateSubscribers.set(userId, new Set());
        }
        balanceUpdateSubscribers.get(userId)?.add(controller);

        // Send keep-alive every 30 seconds
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(`:keep-alive\n\n`);
          } catch (error) {
            console.error('[v0] Keep-alive error:', error);
            clearInterval(keepAliveInterval);
            balanceUpdateSubscribers.get(userId)?.delete(controller);
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
          balanceUpdateSubscribers.get(userId)?.delete(controller);
          console.log('[v0] Balance update subscription ended:', userId);
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('[v0] Balance subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to establish subscription' },
      { status: 500 }
    );
  }
}

/**
 * Broadcast balance update to all subscribed clients
 */
function broadcastBalanceUpdate(userId: string, update: any) {
  const subscribers = balanceUpdateSubscribers.get(userId);
  if (!subscribers) return;

  const eventData = JSON.stringify(update);
  const message = `data: ${eventData}\n\n`;

  for (const controller of subscribers) {
    try {
      controller.enqueue(message);
    } catch (error) {
      console.error('[v0] Failed to send balance update:', error);
      subscribers.delete(controller);
    }
  }
}

/**
 * Trigger manual balance update
 * POST /api/webhooks/balance-updates?action=trigger
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, newBalance, reason } = body;

    if (!accountId || newBalance === undefined || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, newBalance, reason' },
        { status: 400 }
      );
    }

    // Get current balance
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const previousBalance = account.balance;
    const changeAmount = newBalance - previousBalance;

    // Trigger balance update
    const event: BalanceUpdateEvent = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      accountId,
      previousBalance,
      newBalance,
      changeAmount,
      reason
    };

    // Process as webhook
    const response = await fetch(
      new URL('/api/webhooks/balance-updates', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': 'manual-trigger'
        },
        body: JSON.stringify(event)
      }
    );

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });

  } catch (error: any) {
    console.error('[v0] Manual balance update error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger balance update' },
      { status: 500 }
    );
  }
}
