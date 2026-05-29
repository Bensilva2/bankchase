import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface IdempotencyResponse {
  transactionId: string;
  timestamp: string;
  status: string;
  message: string;
  [key: string]: any;
}

/**
 * Idempotency Key Manager
 * Prevents duplicate transactions if a request is retried
 * Stores the response hash in Redis with a 24-hour TTL
 */
export class IdempotencyManager {
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Check if an idempotency key has been seen before
   * Returns the cached response if found, null otherwise
   */
  async getCachedResponse(
    idempotencyKey: string
  ): Promise<IdempotencyResponse | null> {
    try {
      const cached = await redis.get(
        `idempotency:${idempotencyKey}`
      ) as IdempotencyResponse | null;
      if (cached) {
        console.log(
          `[IdempotencyManager] Cache HIT for key: ${idempotencyKey}`
        );
      }
      return cached;
    } catch (error) {
      console.error(
        `[IdempotencyManager] Error checking cache for ${idempotencyKey}:`,
        error
      );
      return null;
    }
  }

  /**
   * Store the response for an idempotency key
   */
  async cacheResponse(
    idempotencyKey: string,
    response: IdempotencyResponse
  ): Promise<boolean> {
    try {
      await redis.setex(
        `idempotency:${idempotencyKey}`,
        this.TTL,
        JSON.stringify(response)
      );
      console.log(
        `[IdempotencyManager] Cached response for key: ${idempotencyKey}`
      );
      return true;
    } catch (error) {
      console.error(
        `[IdempotencyManager] Error caching response for ${idempotencyKey}:`,
        error
      );
      return false;
    }
  }

  /**
   * Mark an idempotency key as processing
   * Prevents concurrent processing of the same request
   */
  async markProcessing(idempotencyKey: string): Promise<boolean> {
    try {
      const lockKey = `idempotency:lock:${idempotencyKey}`;
      const result = await redis.set(lockKey, 'processing', {
        ex: 30, // 30-second lock timeout
        nx: true, // Only set if doesn't exist (atomic check-and-set)
      });
      return result === 'OK';
    } catch (error) {
      console.error(
        `[IdempotencyManager] Error marking processing for ${idempotencyKey}:`,
        error
      );
      return false;
    }
  }

  /**
   * Release the processing lock
   */
  async releaseProcessing(idempotencyKey: string): Promise<void> {
    try {
      const lockKey = `idempotency:lock:${idempotencyKey}`;
      await redis.del(lockKey);
    } catch (error) {
      console.error(
        `[IdempotencyManager] Error releasing lock for ${idempotencyKey}:`,
        error
      );
    }
  }
}

export const idempotencyManager = new IdempotencyManager();
