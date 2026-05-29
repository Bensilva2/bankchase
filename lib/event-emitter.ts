import { EventEmitter } from 'events';
import { Redis } from '@upstash/redis';

// Initialize Redis client for distributed event publishing
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Event types for the banking system
export type TransactionEvent =
  | 'transfer.initiated'
  | 'transfer.completed'
  | 'transfer.failed'
  | 'alert.scheduled'
  | 'compliance.checked';

export interface TransactionEventData {
  transactionId: string;
  senderId: string;
  senderPhone?: string;
  receiverAccount: string;
  amount: number;
  currency: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Singleton event emitter for the application
const transactionEmitter = new EventEmitter();

// Configure to handle high-concurrency scenarios
transactionEmitter.setMaxListeners(100);

/**
 * Publish a transaction event both locally and to Redis for distributed consumption
 */
export async function publishTransactionEvent(
  event: TransactionEvent,
  data: TransactionEventData
): Promise<void> {
  try {
    // Publish locally for immediate consumption in same process
    transactionEmitter.emit(event, data);

    // Publish to Redis for distributed event consumption (future horizontal scaling)
    const eventKey = `banking:${event}:${data.transactionId}`;
    await redis.set(eventKey, JSON.stringify(data), { ex: 3600 }); // 1-hour TTL

    // Also publish to a channel for real-time subscribers
    await redis.publish(`channel:${event}`, JSON.stringify(data));

    console.log(`[EventEmitter] Published ${event}:`, data.transactionId);
  } catch (error) {
    console.error(`[EventEmitter] Failed to publish ${event}:`, error);
    // Don't throw - let local event still fire even if Redis fails
    transactionEmitter.emit(event, data);
  }
}

/**
 * Subscribe to transaction events
 */
export function subscribeToTransactionEvent(
  event: TransactionEvent,
  handler: (data: TransactionEventData) => Promise<void> | void
): void {
  transactionEmitter.on(event, handler);
  console.log(`[EventEmitter] Subscribed to ${event}`);
}

/**
 * Unsubscribe from transaction events
 */
export function unsubscribeFromTransactionEvent(
  event: TransactionEvent,
  handler: (data: TransactionEventData) => Promise<void> | void
): void {
  transactionEmitter.off(event, handler);
  console.log(`[EventEmitter] Unsubscribed from ${event}`);
}

/**
 * Get event emitter instance for advanced use cases
 */
export function getEventEmitter(): EventEmitter {
  return transactionEmitter;
}

/**
 * Initialize event consumers on application startup
 */
export function initializeEventConsumers(): void {
  console.log('[EventEmitter] Initializing event consumers...');
  // Additional consumer initialization can be added here
}
