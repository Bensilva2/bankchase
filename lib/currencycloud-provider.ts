import https from 'https';
import crypto from 'crypto';
import {
  PaymentProvider,
  PaymentProviderConfig,
  TransferRequest,
  TransferResponse,
  BalanceCheckRequest,
  BalanceCheckResponse,
  ExchangeRateRequest,
  ExchangeRateResponse,
  WebhookVerificationRequest,
} from './payment-provider-base';
import { mtlsCertificateManager } from './mtls-certificate-manager';

/**
 * Currencycloud Payment Provider
 * Handles cross-border transfers with FX conversion
 */
export class CurrencyCloudProvider extends PaymentProvider {
  private readonly baseURL = 'https://api.currencycloud.com/v2';
  private httpsAgent: https.Agent | null = null;

  constructor(config: PaymentProviderConfig) {
    super(config, 'currencycloud');
    this.initializeHTTPSAgent();
  }

  /**
   * Initialize mTLS HTTPS agent for secure communication
   */
  private initializeHTTPSAgent(): void {
    try {
      this.httpsAgent = mtlsCertificateManager.getHTTPSAgent();
      console.log(
        '[CurrencyCloudProvider] mTLS HTTPS agent initialized'
      );
    } catch (error) {
      console.warn(
        '[CurrencyCloudProvider] mTLS initialization failed, using standard HTTPS:',
        error
      );
      this.httpsAgent = new https.Agent({
        rejectUnauthorized: true,
      });
    }
  }

  /**
   * Make authenticated API request to Currencycloud
   */
  private async apiRequest(
    method: string,
    endpoint: string,
    body?: Record<string, any>
  ): Promise<Record<string, any>> {
    const url = `${this.baseURL}${endpoint}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Create authentication signature
    const signature = this.createSignature(method, endpoint, body, timestamp);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.currencycloud.com',
        port: 443,
        path: `/v2${endpoint}`,
        method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Auth-Token': this.config.apiKey,
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'User-Agent': 'BankChase/1.0',
        },
        agent: this.httpsAgent,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new Error(
                  `API Error: ${parsed.error_message || parsed.message}`
                )
              );
            } else {
              resolve(parsed);
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        const payload = new URLSearchParams(body).toString();
        req.write(payload);
      }

      req.end();
    });
  }

  /**
   * Create HMAC-SHA256 signature for authentication
   */
  private createSignature(
    method: string,
    endpoint: string,
    body?: Record<string, any>,
    timestamp?: string
  ): string {
    const sigTimestamp = timestamp || Math.floor(Date.now() / 1000).toString();
    const canonicalRequest = [
      method.toUpperCase(),
      endpoint,
      sigTimestamp,
      body ? JSON.stringify(body) : '',
    ].join('\n');

    const signature = crypto
      .createHmac('sha256', this.config.apiSecret || '')
      .update(canonicalRequest)
      .digest('hex');

    return signature;
  }

  /**
   * Initiate a cross-border transfer
   */
  async initiateTransfer(
    request: TransferRequest
  ): Promise<TransferResponse> {
    try {
      console.log(
        `[CurrencyCloudProvider] Initiating transfer: ${request.idempotencyKey}`
      );

      const response = await this.apiRequest('POST', '/payments/create', {
        payer_entity_type: 'individual',
        payer_first_name: 'BankChase',
        beneficiary_entity_type: 'company',
        beneficiary_first_name: 'Receiver',
        currency: request.currency,
        amount: request.amount.toString(),
        reason: request.reference || 'Transfer',
        reference: request.idempotencyKey,
        beneficiary_address: '123 Main St',
        beneficiary_city: 'London',
        beneficiary_country: 'GB',
        beneficiary_postcode: 'SW1A 1AA',
      });

      return {
        success: true,
        providerId: 'currencycloud',
        transactionId: response.id,
        status: 'processing',
        timestamp: new Date().toISOString(),
        reference: response.reference,
        metadata: {
          payment_type: response.payment_type,
          fee: response.fee,
          rate: response.rate,
        },
      };
    } catch (error) {
      console.error(
        '[CurrencyCloudProvider] Transfer initiation failed:',
        error
      );
      return {
        success: false,
        providerId: 'currencycloud',
        transactionId: '',
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check account balance
   */
  async checkBalance(
    request: BalanceCheckRequest
  ): Promise<BalanceCheckResponse> {
    try {
      console.log(
        `[CurrencyCloudProvider] Checking balance for ${request.accountId}`
      );

      const response = await this.apiRequest('GET', `/accounts/${request.accountId}/balances`, {
        currency: request.currency,
      });

      return {
        accountId: request.accountId,
        balance: parseFloat(response.balance || '0'),
        currency: request.currency,
        available: parseFloat(response.available || '0'),
        reserved: parseFloat(response.reserved || '0'),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[CurrencyCloudProvider] Balance check failed:', error);
      return {
        accountId: request.accountId,
        balance: 0,
        currency: request.currency,
        available: 0,
        reserved: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get exchange rate quote
   */
  async getExchangeRate(
    request: ExchangeRateRequest
  ): Promise<ExchangeRateResponse> {
    try {
      console.log(
        `[CurrencyCloudProvider] Getting exchange rate ${request.fromCurrency}/${request.toCurrency}`
      );

      const response = await this.apiRequest('POST', '/reference/rates/detailed', {
        buy_currency: request.toCurrency,
        sell_currency: request.fromCurrency,
        fixed_side: 'buy',
        amount: request.amount.toString(),
      });

      const rate = parseFloat(response.mid_market_rate || '1');
      const convertedAmount = request.amount * rate;
      const fee = parseFloat(response.client_buy_amount || convertedAmount) - convertedAmount;

      return {
        fromCurrency: request.fromCurrency,
        toCurrency: request.toCurrency,
        amount: request.amount,
        rate,
        convertedAmount,
        fee: Math.abs(fee),
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      };
    } catch (error) {
      console.error('[CurrencyCloudProvider] Exchange rate request failed:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Currencycloud
   */
  verifyWebhook(request: WebhookVerificationRequest): boolean {
    try {
      const { payload, signature, timestamp } = request;

      // Verify timestamp (prevent replay attacks)
      if (timestamp) {
        const webhookTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        const maxAgeSeconds = 5 * 60; // 5 minutes

        if (currentTime - webhookTime > maxAgeSeconds) {
          console.warn('[CurrencyCloudProvider] Webhook timestamp is stale');
          return false;
        }
      }

      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', this.config.apiSecret || '')
        .update(payload)
        .digest('hex');

      const isValid =
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );

      if (!isValid) {
        console.warn('[CurrencyCloudProvider] Webhook signature mismatch');
      }

      return isValid;
    } catch (error) {
      console.error('[CurrencyCloudProvider] Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Check provider health/status
   */
  async getProviderStatus(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.apiRequest('GET', '/reference/currencies', {});
      return {
        healthy: true,
        message: 'Currencycloud API is operational',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Currencycloud API is unavailable: ${error}`,
      };
    }
  }
}

export default CurrencyCloudProvider;
