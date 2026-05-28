import { NextRequest, NextResponse } from 'next/server';
import { publishTransactionEvent } from '@/lib/event-emitter';
import { createTransactionState, updateTransactionStatus } from '@/lib/transaction-tracker';

/**
 * POST /api/transfers/internal
 * 
 * Handles internal bank transfers with asynchronous SMS alerts.
 * Returns immediately after ledger lock without waiting for SMS delivery.
 * 
 * Request body:
 * {
 *   senderId: string,
 *   receiverAccountId: string,
 *   amount: number,
 *   currency: string,
 *   senderPhone: string (optional - for SMS alerts)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverAccountId, amount, currency, senderPhone } = body;

    // Validation
    if (!senderId || !receiverAccountId || !amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log(`[TransferAPI] Processing internal transfer: ${transactionId}`);

    // Step 1: Create transaction state in cache
    await createTransactionState(
      transactionId,
      senderId,
      receiverAccountId,
      amount,
      currency
    );

    // Step 2: Update status to validating
    await updateTransactionStatus(transactionId, 'validating', {
      step: 'ledger_validation_started',
      status: 'pending',
    });

    // TODO: Step 3: Lock funds in ledger (ACID compliance)
    // const ledgerResult = await lockFundsInLedger(senderId, amount, currency);
    // if (!ledgerResult.success) {
    //   await updateTransactionStatus(transactionId, 'failed', {
    //     step: 'ledger_validation_failed',
    //     status: 'failed',
    //     details: ledgerResult.error,
    //   });
    //   await publishTransactionEvent('transfer.failed', {
    //     transactionId,
    //     senderId,
    //     receiverAccount: receiverAccountId,
    //     amount,
    //     currency,
    //     timestamp: Date.now(),
    //     senderPhone,
    //   });
    //   return NextResponse.json(
    //     { error: 'Insufficient funds' },
    //     { status: 402 }
    //   );
    // }

    // Step 4: Update status to processing
    await updateTransactionStatus(transactionId, 'processing', {
      step: 'ledger_validation_passed',
      status: 'completed',
    });

    // Step 5: Publish transfer initiated event (triggers async SMS)
    // This happens without blocking the response
    publishTransactionEvent('transfer.initiated', {
      transactionId,
      senderId,
      receiverAccount: receiverAccountId,
      amount,
      currency,
      timestamp: Date.now(),
      senderPhone,
    }).catch((error) => {
      console.error(`[TransferAPI] Error publishing transfer.initiated event:`, error);
      // Don't block response - event publishing failure doesn't prevent transfer
    });

    // Step 6: Return immediately to client (non-blocking)
    console.log(`[TransferAPI] Returning success response for transaction: ${transactionId}`);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Transfer initiated. SMS alert will be sent shortly.',
        transactionId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    // Step 7: (Background - alert consumer handles this)
    // The alert consumer listens for 'transfer.initiated' event
    // and sends SMS asynchronously without blocking this response
  } catch (error) {
    console.error('[TransferAPI] Internal transfer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transfers/internal/status
 * 
 * Fetch transaction status for polling by client
 * 
 * Query params:
 * - transactionId: string
 */
export async function GET(request: NextRequest) {
  try {
    const transactionId = request.nextUrl.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId parameter required' },
        { status: 400 }
      );
    }

    // TODO: Fetch transaction state from cache or database
    // const state = await getTransactionState(transactionId);
    // if (!state) {
    //   return NextResponse.json(
    //     { error: 'Transaction not found' },
    //     { status: 404 }
    //   );
    // }

    // For now, return placeholder
    return NextResponse.json({
      transactionId,
      status: 'processing',
      message: 'Transaction is being processed',
    });
  } catch (error) {
    console.error('[TransferAPI] Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
