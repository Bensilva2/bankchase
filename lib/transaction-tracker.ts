import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export type TransactionStatus =
  | 'initiated'
  | 'validating'
  | 'processing'
  | 'settling'
  | 'completed'
  | 'failed';

export interface TransactionStep {
  step: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  details?: string;
}

export interface TransactionState {
  transactionId: string;
  status: TransactionStatus;
  senderId: string;
  receiverAccount: string;
  amount: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
  steps: TransactionStep[];
  metadata?: Record<string, any>;
}

const TRANSACTION_STATE_TTL = 86400; // 24 hours

/**
 * Create initial transaction state
 */
export async function createTransactionState(
  transactionId: string,
  senderId: string,
  receiverAccount: string,
  amount: number,
  currency: string
): Promise<TransactionState> {
  const now = Date.now();

  const state: TransactionState = {
    transactionId,
    status: 'initiated',
    senderId,
    receiverAccount,
    amount,
    currency,
    createdAt: now,
    updatedAt: now,
    steps: [
      {
        step: 'transaction_initiated',
        status: 'completed',
        timestamp: now,
      },
    ],
  };

  await saveTransactionState(state);
  return state;
}

/**
 * Get transaction state from cache or database
 */
export async function getTransactionState(transactionId: string): Promise<TransactionState | null> {
  try {
    const cached = await redis.get(`transaction:${transactionId}`);

    if (cached) {
      return JSON.parse(cached as string) as TransactionState;
    }

    // TODO: In production, fallback to database query
    // const dbState = await db.transactions.findOne({ id: transactionId });
    // if (dbState) return dbState;

    return null;
  } catch (error) {
    console.error('[TransactionTracker] Error fetching transaction state:', error);
    return null;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  stepDetails?: Omit<TransactionStep, 'timestamp'>
): Promise<void> {
  try {
    const state = await getTransactionState(transactionId);

    if (!state) {
      console.warn(`[TransactionTracker] Transaction not found: ${transactionId}`);
      return;
    }

    state.status = status;
    state.updatedAt = Date.now();

    if (stepDetails) {
      state.steps.push({
        ...stepDetails,
        timestamp: Date.now(),
      });
    }

    await saveTransactionState(state);

    console.log(
      `[TransactionTracker] Updated transaction ${transactionId} to status: ${status}`
    );
  } catch (error) {
    console.error('[TransactionTracker] Error updating transaction status:', error);
  }
}

/**
 * Add step to transaction processing
 */
export async function addTransactionStep(
  transactionId: string,
  step: string,
  status: 'pending' | 'completed' | 'failed',
  details?: string
): Promise<void> {
  try {
    const state = await getTransactionState(transactionId);

    if (!state) {
      console.warn(`[TransactionTracker] Transaction not found: ${transactionId}`);
      return;
    }

    state.steps.push({
      step,
      status,
      details,
      timestamp: Date.now(),
    });

    state.updatedAt = Date.now();

    await saveTransactionState(state);

    console.log(
      `[TransactionTracker] Added step "${step}" (${status}) to transaction ${transactionId}`
    );
  } catch (error) {
    console.error('[TransactionTracker] Error adding transaction step:', error);
  }
}

/**
 * Save transaction state to Redis
 */
async function saveTransactionState(state: TransactionState): Promise<void> {
  try {
    await redis.set(
      `transaction:${state.transactionId}`,
      JSON.stringify(state),
      { ex: TRANSACTION_STATE_TTL }
    );
  } catch (error) {
    console.error('[TransactionTracker] Error saving transaction state:', error);
    // Don't throw - allow operation to continue even if cache fails
  }
}

/**
 * Get all transactions for a user (requires database query in production)
 */
export async function getUserTransactions(userId: string): Promise<TransactionState[]> {
  // TODO: In production, query database
  // const transactions = await db.transactions.find({ senderId: userId });
  // return transactions;

  // For now, return empty array
  console.log(`[TransactionTracker] Fetching transactions for user ${userId}`);
  return [];
}

/**
 * Mark transaction as completed with optional metadata
 */
export async function completeTransaction(
  transactionId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const state = await getTransactionState(transactionId);

    if (!state) {
      console.warn(`[TransactionTracker] Transaction not found: ${transactionId}`);
      return;
    }

    state.status = 'completed';
    state.updatedAt = Date.now();

    if (metadata) {
      state.metadata = { ...state.metadata, ...metadata };
    }

    state.steps.push({
      step: 'transaction_completed',
      status: 'completed',
      timestamp: Date.now(),
    });

    await saveTransactionState(state);
  } catch (error) {
    console.error('[TransactionTracker] Error completing transaction:', error);
  }
}

/**
 * Mark transaction as failed
 */
export async function failTransaction(
  transactionId: string,
  reason: string
): Promise<void> {
  try {
    const state = await getTransactionState(transactionId);

    if (!state) {
      console.warn(`[TransactionTracker] Transaction not found: ${transactionId}`);
      return;
    }

    state.status = 'failed';
    state.updatedAt = Date.now();

    state.steps.push({
      step: 'transaction_failed',
      status: 'failed',
      timestamp: Date.now(),
      details: reason,
    });

    await saveTransactionState(state);
  } catch (error) {
    console.error('[TransactionTracker] Error failing transaction:', error);
  }
}
