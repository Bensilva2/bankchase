import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isTransferStatusChangeEvent,
  TRANSFER_STATUS,
  isTerminalTransferStatus,
} from '@/lib/wise/webhooks';
import * as db from '@/lib/wise/db';

const WEBHOOK_SECRET = process.env.WISE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-signature') || 
                     request.headers.get('X-Signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const bodyText = await request.text();

    // Verify signature
    if (!verifyWebhookSignature(bodyText, signature, WEBHOOK_SECRET)) {
      console.warn('[Wise] Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const payload = JSON.parse(bodyText);
    const event = parseWebhookEvent(payload);

    console.log('[Wise] Webhook received:', {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
    });

    // Create webhook log
    const webhookLog = await db.createWebhookLog({
      event_id: event.id,
      event_type: event.type,
      occurred_at: event.occurredAt || null,
      wise_transfer_id: null,
      user_id: null,
      event_data: event.data,
    });

    // Handle transfer state change events
    if (isTransferStatusChangeEvent(event)) {
      await handleTransferStateChange(event, webhookLog.id);
    }

    // Respond with 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Wise] Webhook processing error:', error);

    // Still return 200 to prevent retry loops, but log the error
    return NextResponse.json(
      { received: true, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}

async function handleTransferStateChange(
  event: any,
  webhookLogId: string
) {
  try {
    const data = event.data as any;
    const wiseTransferId = data.resource?.id;
    const previousStatus = data.previousStatus;
    const currentStatus = data.currentStatus;

    if (!wiseTransferId) {
      console.warn('[Wise] Transfer state change event missing transfer ID');
      return;
    }

    // Find transfer in database
    try {
      const transfer = await db.getTransferByWiseId(wiseTransferId);

      // Update transfer status
      const updateData: any = {
        status: currentStatus,
        previous_status: previousStatus,
      };

      // Add completion timestamp for terminal states
      if (isTerminalTransferStatus(currentStatus)) {
        updateData.completed_at = new Date().toISOString();
      }

      // Handle error states
      if (currentStatus === TRANSFER_STATUS.BOUNCED_BACK) {
        updateData.error_code = 'TRANSFER_BOUNCED';
        updateData.error_message = 'Transfer was bounced back by recipient bank';
      } else if (currentStatus === TRANSFER_STATUS.REJECTED) {
        updateData.error_code = 'TRANSFER_REJECTED';
        updateData.error_message = data.errorMessage || 'Transfer was rejected';
      }

      await db.updateTransfer(transfer.id, updateData);

      // Add event to webhook events log
      const currentEvents = transfer.webhook_events || [];
      const updatedEvents = [
        ...currentEvents,
        {
          type: 'state-change',
          previousStatus,
          currentStatus,
          timestamp: new Date().toISOString(),
          eventId: event.id,
        },
      ];

      await db.updateTransfer(transfer.id, {
        webhook_events: updatedEvents,
      });

      console.log('[Wise] Transfer updated:', {
        wiseTransferId,
        previousStatus,
        currentStatus,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('PGRST116')) {
        // Transfer not found in database - this is fine for webhooks
        // (e.g., if webhook arrives before transfer is created)
        console.log('[Wise] Transfer not found in database:', wiseTransferId);
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('[Wise] Error handling transfer state change:', error);

    // Update webhook log with error
    try {
      await db.updateWebhookLog(webhookLogId, {
        processing_error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (logError) {
      console.error('Failed to update webhook log:', logError);
    }
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
