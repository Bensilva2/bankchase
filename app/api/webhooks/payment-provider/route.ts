import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from '@/lib/security-middleware';
import { webhookSecurityManager } from '@/lib/webhook-security';
import { updateTransactionStatus, createTransactionState } from '@/lib/transaction-tracker';
import { publishTransactionEvent } from '@/lib/event-emitter';

/**
 * Webhook event types from payment providers
 */
export interface WebhookPayload {
  eventId: string;
  eventType: 'transfer.initiated' | 'transfer.completed' | 'transfer.failed' | 'transfer.rejected';
  transactionId: string;
  timestamp: number;
  provider: 'currencycloud' | 'swift' | 'thunes';
  data: {
    amount: number;
    currency: string;
    senderAccount?: string;
    receiverAccount?: string;
    status: string;
    reference?: string;
    errorMessage?: string;
  };
}

/**
 * POST /api/webhooks/payment-provider
 * 
 * Secure webhook listener for payment provider updates
 * Validates signature, timestamp, and publishes internal events
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[WebhookHandler] Received webhook request');

    // Step 1: Get raw payload for signature verification
    const rawPayload = await request.text();

    // Step 2: Validate webhook signature and timestamp
    const signatureResult = SecurityMiddleware.validateWebhookSignature(
      request,
      rawPayload
    );

    if (!signatureResult.valid) {
      console.warn(
        `[WebhookHandler] Webhook signature validation failed: ${signatureResult.error}`
      );
      return NextResponse.json(
        { error: signatureResult.error },
        { status: 401 }
      );
    }

    const payload = signatureResult.payload as WebhookPayload;

    // Step 3: Validate webhook structure
    if (!payload.eventId || !payload.transactionId || !payload.eventType) {
      console.warn('[WebhookHandler] Invalid webhook payload structure');
      return NextResponse.json(
        { error: 'Invalid webhook structure' },
        { status: 400 }
      );
    }

    // Step 4: Check for duplicate webhooks (idempotency)
    const isDuplicate = await checkDuplicateWebhook(payload.eventId);
    if (isDuplicate) {
      console.log(
        `[WebhookHandler] Duplicate webhook detected for eventId: ${payload.eventId}`
      );
      // Return 200 OK to acknowledge receipt without reprocessing
      return NextResponse.json({
        status: 'acknowledged',
        message: 'Webhook already processed',
        eventId: payload.eventId,
      });
    }

    // Step 5: Mark webhook as processed
    await markWebhookAsProcessed(payload.eventId);

    // Step 6: Handle based on event type
    await handleWebhookEvent(payload);

    // Step 7: Respond with success
    return NextResponse.json(
      {
        status: 'success',
        message: 'Webhook processed',
        eventId: payload.eventId,
        transactionId: payload.transactionId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WebhookHandler] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle different webhook event types
 */
async function handleWebhookEvent(payload: WebhookPayload): Promise<void> {
  const { transactionId, eventType, data, timestamp } = payload;

  switch (eventType) {
    case 'transfer.initiated':
      console.log(`[WebhookHandler] Processing transfer.initiated: ${transactionId}`);
      await updateTransactionStatus(transactionId, 'processing', {
        step: 'provider_initiated',
        status: 'pending',
        provider: payload.provider,
        reference: data.reference,
      });
      await publishTransactionEvent('transfer.initiated', {
        transactionId,
        senderId: 'webhook-triggered',
        receiverAccount: data.receiverAccount || '',
        amount: data.amount,
        currency: data.currency,
        timestamp,
        reference: data.reference,
      });
      break;

    case 'transfer.completed':
      console.log(`[WebhookHandler] Processing transfer.completed: ${transactionId}`);
      await updateTransactionStatus(transactionId, 'completed', {
        step: 'provider_completed',
        status: 'success',
        provider: payload.provider,
        completedAt: new Date().toISOString(),
        reference: data.reference,
      });
      await publishTransactionEvent('transfer.completed', {
        transactionId,
        senderId: 'webhook-triggered',
        receiverAccount: data.receiverAccount || '',
        amount: data.amount,
        currency: data.currency,
        timestamp,
        reference: data.reference,
      });
      break;

    case 'transfer.failed':
      console.log(`[WebhookHandler] Processing transfer.failed: ${transactionId}`);
      await updateTransactionStatus(transactionId, 'failed', {
        step: 'provider_failed',
        status: 'failed',
        provider: payload.provider,
        errorMessage: data.errorMessage,
        failedAt: new Date().toISOString(),
      });
      await publishTransactionEvent('transfer.failed', {
        transactionId,
        senderId: 'webhook-triggered',
        receiverAccount: data.receiverAccount || '',
        amount: data.amount,
        currency: data.currency,
        timestamp,
        error: data.errorMessage,
      });
      break;

    case 'transfer.rejected':
      console.log(`[WebhookHandler] Processing transfer.rejected: ${transactionId}`);
      await updateTransactionStatus(transactionId, 'rejected', {
        step: 'provider_rejected',
        status: 'rejected',
        provider: payload.provider,
        reason: data.errorMessage,
        rejectedAt: new Date().toISOString(),
      });
      break;

    default:
      console.warn(`[WebhookHandler] Unknown event type: ${eventType}`);
  }
}

/**
 * Check if webhook has already been processed (prevent duplicates)
 */
async function checkDuplicateWebhook(eventId: string): Promise<boolean> {
  try {
    // TODO: Check Redis for eventId
    // For now, always process
    return false;
  } catch (error) {
    console.error('[WebhookHandler] Error checking for duplicates:', error);
    return false;
  }
}

/**
 * Mark webhook as processed
 */
async function markWebhookAsProcessed(eventId: string): Promise<void> {
  try {
    // TODO: Store eventId in Redis with 24-hour TTL
    console.log(`[WebhookHandler] Marked webhook as processed: ${eventId}`);
  } catch (error) {
    console.error('[WebhookHandler] Error marking webhook as processed:', error);
  }
}
