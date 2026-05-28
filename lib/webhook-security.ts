import crypto from 'crypto';

/**
 * Webhook Security Manager
 * Handles HMAC signature verification for secure webhook communication
 * with external payment providers (Currencycloud, SWIFT, etc.)
 */
export class WebhookSecurityManager {
  private readonly webhookSecret: string;

  constructor(secret?: string) {
    this.webhookSecret = secret || process.env.WEBHOOK_SECRET || '';
    if (!this.webhookSecret) {
      console.warn(
        '[WebhookSecurityManager] No WEBHOOK_SECRET provided. Signature verification will fail.'
      );
    }
  }

  /**
   * Generate HMAC signature for outgoing webhook requests
   * Used when calling external payment provider webhooks
   */
  generateSignature(payload: Record<string, any>): string {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');
    return signature;
  }

  /**
   * Verify incoming webhook signature
   * Ensures webhook came from trusted payment provider
   */
  verifySignature(
    payload: string,
    providedSignature: string
  ): boolean {
    try {
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const matches =
        crypto.timingSafeEqual(
          Buffer.from(computedSignature),
          Buffer.from(providedSignature)
        );

      if (matches) {
        console.log('[WebhookSecurityManager] Signature verification passed');
      } else {
        console.warn('[WebhookSecurityManager] Signature verification failed');
      }

      return matches;
    } catch (error) {
      console.error(
        '[WebhookSecurityManager] Error verifying signature:',
        error
      );
      return false;
    }
  }

  /**
   * Verify webhook timestamp (prevent replay attacks)
   * Ensures webhook is recent (within 5 minutes)
   */
  verifyTimestamp(timestamp: string | number): boolean {
    try {
      const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      const currentTime = Date.now();
      const maxAgeMs = 5 * 60 * 1000; // 5 minutes

      const isValid = currentTime - webhookTime < maxAgeMs;

      if (!isValid) {
        console.warn(
          `[WebhookSecurityManager] Webhook timestamp is stale: ${new Date(webhookTime).toISOString()}`
        );
      }

      return isValid;
    } catch (error) {
      console.error('[WebhookSecurityManager] Error verifying timestamp:', error);
      return false;
    }
  }

  /**
   * Parse and validate webhook payload
   * Returns parsed payload if valid, throws error if invalid
   */
  parseAndValidate(
    rawPayload: string,
    signatureHeader: string,
    timestampHeader?: string
  ): Record<string, any> {
    // Verify signature
    if (!this.verifySignature(rawPayload, signatureHeader)) {
      throw new Error('Webhook signature verification failed');
    }

    // Verify timestamp if provided
    if (timestampHeader && !this.verifyTimestamp(timestampHeader)) {
      throw new Error('Webhook timestamp is stale or invalid');
    }

    // Parse payload
    try {
      const payload = JSON.parse(rawPayload);
      return payload;
    } catch (error) {
      throw new Error('Invalid webhook payload JSON');
    }
  }
}

export const webhookSecurityManager = new WebhookSecurityManager();
