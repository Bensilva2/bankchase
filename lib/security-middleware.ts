import { NextRequest, NextResponse } from 'next/server';
import { idempotencyManager } from './idempotency-manager';
import { webhookSecurityManager } from './webhook-security';

/**
 * Security Middleware
 * Validates idempotency keys, rate limits, and webhook signatures
 */
export class SecurityMiddleware {
  /**
   * Validate idempotency key header
   * Returns cached response if request was already processed
   */
  static async validateIdempotency(request: NextRequest) {
    const idempotencyKey = request.headers.get('Idempotency-Key');

    if (!idempotencyKey) {
      return {
        valid: false,
        error: 'Missing Idempotency-Key header',
        statusCode: 400,
      };
    }

    // Check format (UUID or similar)
    if (!/^[a-zA-Z0-9\-_]{20,100}$/.test(idempotencyKey)) {
      return {
        valid: false,
        error: 'Invalid Idempotency-Key format',
        statusCode: 400,
      };
    }

    // Check if already processed
    const cached = await idempotencyManager.getCachedResponse(idempotencyKey);
    if (cached) {
      return {
        valid: true,
        cached: true,
        response: cached,
        statusCode: 200,
      };
    }

    // Try to acquire processing lock
    const acquired = await idempotencyManager.markProcessing(idempotencyKey);
    if (!acquired) {
      return {
        valid: false,
        error: 'Request is already being processed (duplicate detected)',
        statusCode: 409,
      };
    }

    return {
      valid: true,
      cached: false,
      idempotencyKey,
    };
  }

  /**
   * Validate webhook signature and timestamp
   */
  static validateWebhookSignature(
    request: NextRequest,
    rawPayload: string
  ): { valid: boolean; payload?: Record<string, any>; error?: string } {
    try {
      const signatureHeader = request.headers.get('X-Signature');
      const timestampHeader = request.headers.get('X-Timestamp');

      if (!signatureHeader) {
        return {
          valid: false,
          error: 'Missing X-Signature header',
        };
      }

      const payload = webhookSecurityManager.parseAndValidate(
        rawPayload,
        signatureHeader,
        timestampHeader || undefined
      );

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      console.error(
        '[SecurityMiddleware] Webhook validation error:',
        error
      );
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Rate limiting check (simple in-memory, upgrade to Redis for production)
   */
  static async checkRateLimit(
    identifier: string, // IP address, API key, etc.
    limit: number = 100, // requests per window
    windowMs: number = 60000 // 1 minute
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    // TODO: Implement proper rate limiting with Redis
    // For now, return unlimited
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowMs,
    };
  }

  /**
   * Validate API key (if using API key auth)
   */
  static validateAPIKey(request: NextRequest): {
    valid: boolean;
    keyId?: string;
    error?: string;
  } {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing or invalid Authorization header',
      };
    }

    const apiKey = authHeader.substring(7);

    // TODO: Validate API key against database
    // For now, accept any Bearer token
    return {
      valid: true,
      keyId: apiKey.substring(0, 10) + '***',
    };
  }
}

export default SecurityMiddleware;
