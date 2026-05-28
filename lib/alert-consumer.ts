import { subscribeToTransactionEvent, TransactionEventData } from './event-emitter';
import { sendTransactionAlert } from './sms-service';

interface AlertRetry {
  transactionId: string;
  phone: string;
  amount: number;
  currency: string;
  retryCount: number;
  lastRetryTime: number;
}

// In-memory retry queue for failed SMS attempts
const retryQueue: Map<string, AlertRetry> = new Map();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds initial delay
const EXPONENTIAL_BACKOFF = 2;

/**
 * Initialize the alert consumer to listen for transaction events
 * This runs asynchronously and doesn't block the main transfer process
 */
export function initializeAlertConsumer(): void {
  console.log('[AlertConsumer] Initializing background SMS alert consumer...');

  // Listen for transfer initiated events
  subscribeToTransactionEvent('transfer.initiated', handleTransferInitiated);
  subscribeToTransactionEvent('transfer.completed', handleTransferCompleted);
  subscribeToTransactionEvent('transfer.failed', handleTransferFailed);

  // Start retry loop for failed alerts
  startRetryLoop();

  console.log('[AlertConsumer] Alert consumer ready to process events');
}

/**
 * Handle transfer initiated event - send immediate alert
 */
async function handleTransferInitiated(data: TransactionEventData): Promise<void> {
  if (!data.senderPhone) {
    console.log(`[AlertConsumer] No phone provided for transaction ${data.transactionId}`);
    return;
  }

  try {
    console.log(`[AlertConsumer] Processing transfer.initiated for ${data.transactionId}`);

    const result = await sendTransactionAlert(data.senderPhone, {
      type: 'transfer',
      amount: data.amount,
      accountLast4: data.receiverAccount.slice(-4),
      reference: data.transactionId,
    });

    if (result.success) {
      console.log(`[AlertConsumer] SMS sent successfully to ${data.senderPhone}`);
      logAlertDelivery(data.transactionId, data.senderPhone, 'success');
    } else {
      console.warn(`[AlertConsumer] SMS failed for ${data.transactionId}, adding to retry queue`);
      addToRetryQueue(data.transactionId, data.senderPhone, data.amount, data.currency);
      logAlertDelivery(data.transactionId, data.senderPhone, 'failed', result.error);
    }
  } catch (error) {
    console.error(`[AlertConsumer] Error sending SMS for ${data.transactionId}:`, error);
    addToRetryQueue(data.transactionId, data.senderPhone, data.amount, data.currency);
    logAlertDelivery(data.transactionId, data.senderPhone, 'error', String(error));
  }
}

/**
 * Handle transfer completed event
 */
async function handleTransferCompleted(data: TransactionEventData): Promise<void> {
  if (!data.senderPhone) return;

  try {
    const result = await sendTransactionAlert(data.senderPhone, {
      type: 'transfer',
      amount: data.amount,
      accountLast4: data.receiverAccount.slice(-4),
      reference: data.transactionId,
    });

    if (result.success) {
      logAlertDelivery(data.transactionId, data.senderPhone, 'success');
    } else {
      logAlertDelivery(data.transactionId, data.senderPhone, 'failed', result.error);
    }
  } catch (error) {
    console.error(`[AlertConsumer] Error sending completion alert:`, error);
    logAlertDelivery(data.transactionId, data.senderPhone, 'error', String(error));
  }
}

/**
 * Handle transfer failed event
 */
async function handleTransferFailed(data: TransactionEventData): Promise<void> {
  if (!data.senderPhone) return;

  try {
    const result = await sendTransactionAlert(data.senderPhone, {
      type: 'transfer',
      amount: data.amount,
      accountLast4: data.receiverAccount.slice(-4),
      reference: data.transactionId,
    });

    if (result.success) {
      logAlertDelivery(data.transactionId, data.senderPhone, 'success');
    } else {
      logAlertDelivery(data.transactionId, data.senderPhone, 'failed', result.error);
    }
  } catch (error) {
    console.error(`[AlertConsumer] Error sending failure alert:`, error);
    logAlertDelivery(data.transactionId, data.senderPhone, 'error', String(error));
  }
}

/**
 * Add failed alert to retry queue
 */
function addToRetryQueue(
  transactionId: string,
  phone: string,
  amount: number,
  currency: string
): void {
  const key = `${transactionId}-${phone}`;

  if (retryQueue.has(key)) {
    const existing = retryQueue.get(key)!;
    existing.retryCount++;
    existing.lastRetryTime = Date.now();
  } else {
    retryQueue.set(key, {
      transactionId,
      phone,
      amount,
      currency,
      retryCount: 0,
      lastRetryTime: Date.now(),
    });
  }

  console.log(`[AlertConsumer] Added to retry queue (attempt ${retryQueue.get(key)?.retryCount}):`, key);
}

/**
 * Process retry queue periodically
 */
function startRetryLoop(): void {
  setInterval(async () => {
    const now = Date.now();
    const entriesToProcess: [string, AlertRetry][] = [];

    // Find entries ready for retry
    retryQueue.forEach((entry, key) => {
      if (entry.retryCount >= MAX_RETRIES) {
        console.log(`[AlertConsumer] Exhausted retries for ${key}`);
        retryQueue.delete(key);
        return;
      }

      const delay = RETRY_DELAY_MS * Math.pow(EXPONENTIAL_BACKOFF, entry.retryCount);
      if (now - entry.lastRetryTime >= delay) {
        entriesToProcess.push([key, entry]);
      }
    });

    // Process ready entries
    for (const [key, entry] of entriesToProcess) {
      try {
        const result = await sendTransactionAlert(entry.phone, {
          type: 'transfer',
          amount: entry.amount,
          accountLast4: '****',
          reference: entry.transactionId,
        });

        if (result.success) {
          console.log(`[AlertConsumer] Retry successful for ${key}`);
          retryQueue.delete(key);
          logAlertDelivery(entry.transactionId, entry.phone, 'success_retry');
        } else {
          entry.retryCount++;
          entry.lastRetryTime = now;
          console.log(`[AlertConsumer] Retry failed, will retry later: ${key}`);
        }
      } catch (error) {
        entry.retryCount++;
        entry.lastRetryTime = now;
        console.error(`[AlertConsumer] Error during retry:`, error);
      }
    }
  }, 10000); // Check retry queue every 10 seconds
}

/**
 * Log alert delivery to database for compliance and auditing
 * In production, this would write to a transaction_alerts table
 */
function logAlertDelivery(
  transactionId: string,
  phone: string,
  status: 'success' | 'failed' | 'error' | 'success_retry',
  errorMessage?: string
): void {
  const logEntry = {
    transactionId,
    phone,
    status,
    errorMessage,
    timestamp: new Date().toISOString(),
  };

  console.log('[AlertConsumer] Alert delivery log:', JSON.stringify(logEntry));

  // TODO: In production, write to database:
  // await db.transaction_alerts.insert(logEntry);
}

/**
 * Get retry queue status for monitoring
 */
export function getRetryQueueStatus(): {
  pendingRetries: number;
  queueEntries: AlertRetry[];
} {
  return {
    pendingRetries: retryQueue.size,
    queueEntries: Array.from(retryQueue.values()),
  };
}
