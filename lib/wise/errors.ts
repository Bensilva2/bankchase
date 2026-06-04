import { AxiosError } from 'axios';

export class WiseAPIError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WiseAPIError';
  }
}

export function handleWiseError(error: unknown): WiseAPIError {
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status || 500;
    const data = error.response?.data as Record<string, unknown> | undefined;

    // Handle different Wise error formats
    if (data?.errorCode) {
      return new WiseAPIError(
        statusCode,
        data.errorCode as string,
        data.message as string || 'Unknown error',
        data.details as Record<string, unknown> | undefined
      );
    }

    if (data?.error) {
      return new WiseAPIError(
        statusCode,
        data.error as string,
        data.error_description as string || 'Unknown error'
      );
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return new WiseAPIError(408, 'REQUEST_TIMEOUT', 'Request timeout');
    }

    if (error.code === 'ENOTFOUND') {
      return new WiseAPIError(503, 'SERVICE_UNAVAILABLE', 'Wise API service unavailable');
    }

    return new WiseAPIError(
      statusCode,
      'UNKNOWN_ERROR',
      error.message || 'Unknown error'
    );
  }

  if (error instanceof Error) {
    return new WiseAPIError(500, 'INTERNAL_ERROR', error.message);
  }

  return new WiseAPIError(500, 'UNKNOWN_ERROR', 'An unknown error occurred');
}

// Specific error codes documented by Wise
export const WISE_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  RECIPIENT_BANK_DETAILS_INVALID: 'RECIPIENT_BANK_DETAILS_INVALID',

  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ROUTE_NOT_AVAILABLE: 'ROUTE_NOT_AVAILABLE',
  TRANSFER_CANNOT_BE_CREATED: 'TRANSFER_CANNOT_BE_CREATED',
  KYC_REQUIRED: 'KYC_REQUIRED',
  PROFILE_NOT_ACTIVE: 'PROFILE_NOT_ACTIVE',

  // Recipient errors
  RECIPIENT_ALREADY_EXISTS: 'RECIPIENT_ALREADY_EXISTS',
  RECIPIENT_NOT_FOUND: 'RECIPIENT_NOT_FOUND',

  // Transfer errors
  TRANSFER_NOT_FOUND: 'TRANSFER_NOT_FOUND',
  TRANSFER_ALREADY_FUNDED: 'TRANSFER_ALREADY_FUNDED',
  TRANSFER_EXPIRED: 'TRANSFER_EXPIRED',

  // Quote errors
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  QUOTE_EXPIRED: 'QUOTE_EXPIRED',
} as const;

export function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    [WISE_ERROR_CODES.INSUFFICIENT_BALANCE]: 'Insufficient balance to complete this transfer',
    [WISE_ERROR_CODES.ROUTE_NOT_AVAILABLE]: 'Transfer route not available. Please select a different recipient or currency pair',
    [WISE_ERROR_CODES.KYC_REQUIRED]: 'Account verification required. Please complete your KYC verification',
    [WISE_ERROR_CODES.RECIPIENT_BANK_DETAILS_INVALID]: 'Recipient bank details are invalid. Please check and try again',
    [WISE_ERROR_CODES.TRANSFER_EXPIRED]: 'Transfer quote has expired. Please create a new quote',
    [WISE_ERROR_CODES.QUOTE_EXPIRED]: 'Quote has expired. Please create a new quote',
    [WISE_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
    [WISE_ERROR_CODES.INVALID_AMOUNT]: 'Invalid transfer amount',
    [WISE_ERROR_CODES.PROFILE_NOT_ACTIVE]: 'Your profile is not active. Please contact support',
  };

  return messages[errorCode] || 'An error occurred. Please try again';
}

export function isRetryableError(error: WiseAPIError): boolean {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.statusCode);
}

export function exponentialBackoff(attemptNumber: number, baseDelayMs: number = 1000): number {
  const delay = baseDelayMs * Math.pow(2, attemptNumber);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return delay + jitter;
}
