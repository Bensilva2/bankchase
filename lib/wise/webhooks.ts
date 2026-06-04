import crypto from 'crypto';

interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
  occurredAt?: string;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Wise] Webhook signature verification failed:', error);
    return false;
  }
}

export function parseWebhookEvent(payload: unknown): WebhookEvent {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const event = payload as Record<string, unknown>;

  if (!event.id || !event.type || !event.timestamp) {
    throw new Error('Missing required webhook fields');
  }

  return {
    id: event.id as string,
    type: event.type as string,
    timestamp: event.timestamp as string,
    data: event.data as Record<string, unknown>,
    occurredAt: event.occurredAt as string | undefined,
  };
}

export function isTransferStatusChangeEvent(
  event: WebhookEvent
): event is WebhookEvent & { data: { previousStatus: string; currentStatus: string } } {
  return event.type === 'transfers#state-change';
}

export function isBalanceChangeEvent(event: WebhookEvent): boolean {
  return event.type === 'balances#credit' || event.type === 'balances#debit';
}

export const WISE_WEBHOOK_EVENTS = {
  TRANSFER_STATE_CHANGE: 'transfers#state-change',
  TRANSFER_CREATED: 'transfers#created',
  BALANCE_CREDIT: 'balances#credit',
  BALANCE_DEBIT: 'balances#debit',
  PROFILE_STATE_CHANGE: 'profiles#state-change',
  KYC_REVIEW_STATE_CHANGE: 'kyc-reviews#state-change',
} as const;

export const TRANSFER_STATUS = {
  INCOMING_PAYMENT_WAITING: 'incoming_payment_waiting',
  PROCESSING: 'processing',
  OUTGOING_PAYMENT_SENT: 'outgoing_payment_sent',
  BOUNCED_BACK: 'bounced_back',
  CANCELLED: 'cancelled',
  FUNDS_CONVERTED: 'funds_converted',
  RECEIVED: 'received',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

export function isTerminalTransferStatus(status: string): boolean {
  return [
    TRANSFER_STATUS.BOUNCED_BACK,
    TRANSFER_STATUS.CANCELLED,
    TRANSFER_STATUS.COMPLETED,
    TRANSFER_STATUS.RECEIVED,
    TRANSFER_STATUS.REJECTED,
  ].includes(status as any);
}
