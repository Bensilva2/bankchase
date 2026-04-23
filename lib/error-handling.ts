'use client'

/**
 * Advanced Error Handling & Retry Logic
 * Handles all banking operation failures with intelligent retry strategies
 * Ensures reliability and smooth user experience
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BankingError {
  code: string
  message: string
  severity: ErrorSeverity
  retryable: boolean
  userFriendlyMessage: string
  timestamp: number
  context?: Record<string, any>
}

export interface RetryStrategy {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterFactor: number // 0-1 to add randomness
}

/**
 * Default retry strategies for different operation types
 */
const DEFAULT_STRATEGIES: Record<string, RetryStrategy> = {
  transfer: {
    maxAttempts: 4,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  billPayment: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  checkDeposit: {
    maxAttempts: 2,
    initialDelayMs: 1500,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  accountCreation: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 12000,
    backoffMultiplier: 2,
    jitterFactor: 0.15,
  },
  default: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
}

/**
 * Classify errors and determine if they're retryable
 */
export function classifyError(error: any): BankingError {
  const message = error?.message || String(error)
  const status = error?.status || error?.statusCode

  console.log('[v0] Classifying error:', { message, status })

  // Network errors - always retryable
  if (message.includes('Network') || message.includes('timeout') || message.includes('ECONNREFUSED')) {
    return {
      code: 'NETWORK_ERROR',
      message,
      severity: 'high',
      retryable: true,
      userFriendlyMessage: 'Connection issue. We\'ll automatically retry.',
      timestamp: Date.now(),
    }
  }

  // Timeout errors - retryable
  if (message.includes('timeout') || message.includes('REQUEST_TIMEOUT')) {
    return {
      code: 'TIMEOUT',
      message,
      severity: 'high',
      retryable: true,
      userFriendlyMessage: 'Taking longer than expected. Retrying...',
      timestamp: Date.now(),
    }
  }

  // Server errors (5xx) - retryable
  if (status >= 500 && status < 600) {
    return {
      code: `SERVER_ERROR_${status}`,
      message,
      severity: 'medium',
      retryable: true,
      userFriendlyMessage: 'Server issue. Please try again.',
      timestamp: Date.now(),
    }
  }

  // Rate limiting - retryable
  if (status === 429 || message.includes('rate limit')) {
    return {
      code: 'RATE_LIMITED',
      message,
      severity: 'medium',
      retryable: true,
      userFriendlyMessage: 'Too many requests. Trying again soon...',
      timestamp: Date.now(),
    }
  }

  // Client errors (4xx) - mostly not retryable
  if (status >= 400 && status < 500) {
    // Some 4xx errors might be retryable
    if (status === 408 || status === 409) {
      return {
        code: `CLIENT_ERROR_${status}`,
        message,
        severity: 'medium',
        retryable: true,
        userFriendlyMessage: 'Conflict detected. Retrying operation...',
        timestamp: Date.now(),
      }
    }

    return {
      code: `CLIENT_ERROR_${status}`,
      message,
      severity: 'high',
      retryable: false,
      userFriendlyMessage: 'Invalid request. Please check and try again.',
      timestamp: Date.now(),
    }
  }

  // Authentication/authorization errors - not retryable
  if (message.includes('Unauthorized') || message.includes('Forbidden') || status === 401 || status === 403) {
    return {
      code: 'AUTH_ERROR',
      message,
      severity: 'critical',
      retryable: false,
      userFriendlyMessage: 'Authentication failed. Please sign in again.',
      timestamp: Date.now(),
    }
  }

  // Insufficient funds - not retryable
  if (message.includes('Insufficient') || message.includes('insufficient funds')) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      message,
      severity: 'high',
      retryable: false,
      userFriendlyMessage: 'Insufficient funds. Check your balance and try again.',
      timestamp: Date.now(),
    }
  }

  // Validation errors - not retryable
  if (message.includes('Invalid') || message.includes('validation') || message.includes('Validation')) {
    return {
      code: 'VALIDATION_ERROR',
      message,
      severity: 'high',
      retryable: false,
      userFriendlyMessage: 'Please check the information and try again.',
      timestamp: Date.now(),
    }
  }

  // Default unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message,
    severity: 'high',
    retryable: false,
    userFriendlyMessage: 'An error occurred. Please try again.',
    timestamp: Date.now(),
  }
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  strategy: RetryStrategy
): number {
  const exponentialDelay = Math.min(
    strategy.initialDelayMs * Math.pow(strategy.backoffMultiplier, attempt - 1),
    strategy.maxDelayMs
  )

  const jitter = exponentialDelay * strategy.jitterFactor * Math.random()
  return Math.round(exponentialDelay + jitter)
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  operationType: string = 'default',
  onRetry?: (attempt: number, error: BankingError) => void
): Promise<T> {
  const strategy = DEFAULT_STRATEGIES[operationType] || DEFAULT_STRATEGIES.default
  let lastError: BankingError | null = null

  for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
    try {
      console.log(`[v0] Attempt ${attempt}/${strategy.maxAttempts} for ${operationType}`)
      return await fn()
    } catch (error) {
      lastError = classifyError(error)

      console.error(`[v0] Attempt ${attempt} failed:`, lastError)

      // If not retryable or last attempt, throw error
      if (!lastError.retryable || attempt === strategy.maxAttempts) {
        throw lastError
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, strategy)
      console.log(`[v0] Retrying after ${delay}ms...`)

      // Notify about retry
      onRetry?.(attempt, lastError)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Wrapper for async banking operations with retry logic
 */
export function withRetry<T extends any[], R>(
  operationType: string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: T) {
      return retryWithBackoff(
        () => originalMethod.apply(this, args),
        operationType,
        (attempt, error) => {
          console.log(`[v0] Retrying ${propertyKey} (attempt ${attempt}):`, error)
        }
      )
    }

    return descriptor
  }
}

/**
 * Store failed operations for retry later
 */
export class FailedOperationQueue {
  private queue: Array<{
    id: string
    operation: string
    params: any
    timestamp: number
    attempts: number
  }> = []

  add(operation: string, params: any) {
    const id = `${operation}-${Date.now()}-${Math.random()}`
    this.queue.push({
      id,
      operation,
      params,
      timestamp: Date.now(),
      attempts: 0,
    })
    console.log(`[v0] Added failed operation to queue: ${id}`)
    return id
  }

  remove(id: string) {
    this.queue = this.queue.filter(op => op.id !== id)
  }

  getAll() {
    return [...this.queue]
  }

  getPending(maxAge = 3600000) {
    // Default 1 hour
    const now = Date.now()
    return this.queue.filter(op => now - op.timestamp < maxAge && op.attempts < 5)
  }

  incrementAttempts(id: string) {
    const op = this.queue.find(o => o.id === id)
    if (op) {
      op.attempts++
    }
  }

  clear() {
    this.queue = []
  }
}

// Export singleton
export const failedOperationQueue = new FailedOperationQueue()
