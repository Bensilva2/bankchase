/**
 * Payment Provider Interface
 * Defines the contract that all payment providers must implement
 */
export interface PaymentProviderConfig {
  apiKey: string;
  apiSecret?: string;
  endpoint: string;
  timeout?: number;
  clientCert?: string;
  clientKey?: string;
  caCert?: string;
}

export interface TransferRequest {
  senderAccountId: string;
  receiverAccountId: string;
  receiverBankCode: string;
  amount: number;
  currency: string;
  reference?: string;
  idempotencyKey: string;
}

export interface TransferResponse {
  success: boolean;
  providerId: string;
  transactionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  error?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface BalanceCheckRequest {
  accountId: string;
  currency: string;
}

export interface BalanceCheckResponse {
  accountId: string;
  balance: number;
  currency: string;
  available: number;
  reserved: number;
  timestamp: string;
}

export interface ExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface ExchangeRateResponse {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  convertedAmount: number;
  fee?: number;
  timestamp: string;
  expiresAt: string;
}

export interface WebhookVerificationRequest {
  payload: string;
  signature: string;
  timestamp?: string;
}

export abstract class PaymentProvider {
  protected config: PaymentProviderConfig;
  protected name: string;

  constructor(config: PaymentProviderConfig, name: string) {
    this.config = config;
    this.name = name;
  }

  abstract initiateTransfer(
    request: TransferRequest
  ): Promise<TransferResponse>;

  abstract checkBalance(
    request: BalanceCheckRequest
  ): Promise<BalanceCheckResponse>;

  abstract getExchangeRate(
    request: ExchangeRateRequest
  ): Promise<ExchangeRateResponse>;

  abstract verifyWebhook(
    request: WebhookVerificationRequest
  ): boolean;

  abstract getProviderStatus(): Promise<{ healthy: boolean; message: string }>;
}

export default PaymentProvider;
