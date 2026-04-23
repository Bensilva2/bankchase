'use client'

/**
 * Unified Banking API Client
 * Handles all banking operations with consistent real-time response handling
 * Ensures all drawers work smoothly with automatic retries and error handling
 */

interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: number
}

interface TransferResponse {
  transferId: string
  status: 'completed' | 'pending' | 'failed'
  amount: number
  timestamp: string
  message: string
}

interface BillPaymentResponse {
  paymentId: string
  status: 'completed' | 'pending' | 'scheduled'
  amount: number
  payeeName: string
  paymentDate: string
  message: string
}

interface CheckDepositResponse {
  depositId: string
  status: 'pending' | 'processing' | 'completed'
  amount: number
  checkNumber: string
  estimatedCreditDate: string
  message: string
}

interface AccountOpenResponse {
  accountId: string
  accountNumber: string
  routingNumber: string
  status: 'active' | 'pending'
  initialBalance: number
  message: string
}

export class BankingAPIClient {
  private baseUrl = '/api'
  private defaultTimeout = 30000
  private retryAttempts = 3
  private retryDelay = 1000

  /**
   * Generic fetch with retry logic
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<APIResponse<T>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : ''

    try {
      const response = await Promise.race([
        fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
            ...options.headers,
          },
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.defaultTimeout)
        ),
      ])

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      return {
        success: true,
        data,
        timestamp: Date.now(),
      }
    } catch (error) {
      console.error(`[v0] API error (attempt ${attempt}):`, error)

      if (attempt < this.retryAttempts) {
        console.log(`[v0] Retrying in ${this.retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(endpoint, options, attempt + 1)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      }
    }
  }

  /**
   * Send Money via Zelle
   */
  async sendZelle(
    fromAccountId: string,
    amount: number,
    recipientEmail: string,
    recipientName: string
  ): Promise<APIResponse<TransferResponse>> {
    console.log('[v0] Processing Zelle transfer...')

    return this.fetchWithRetry<TransferResponse>('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        action: 'zelle',
        fromAccountId,
        amount,
        recipientEmail,
        recipientName,
      }),
    })
  }

  /**
   * Internal Transfer Between Accounts
   */
  async transferFunds(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string
  ): Promise<APIResponse<TransferResponse>> {
    console.log('[v0] Processing internal transfer...')

    return this.fetchWithRetry<TransferResponse>('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        action: 'internal',
        fromAccountId,
        toAccountId,
        amount,
        description,
      }),
    })
  }

  /**
   * Wire Transfer
   */
  async sendWire(
    fromAccountId: string,
    amount: number,
    recipientName: string,
    recipientBank: string,
    routingNumber: string,
    accountNumber: string,
    wireType: 'domestic' | 'international' = 'domestic'
  ): Promise<APIResponse<TransferResponse>> {
    console.log('[v0] Processing wire transfer...')

    return this.fetchWithRetry<TransferResponse>('/transfers', {
      method: 'POST',
      body: JSON.stringify({
        action: 'wire',
        wireType,
        fromAccountId,
        amount,
        recipientName,
        recipientBank,
        routingNumber,
        accountNumber,
      }),
    })
  }

  /**
   * Pay Bill
   */
  async payBill(
    fromAccountId: string,
    payeeId: string,
    amount: number,
    paymentDate: string
  ): Promise<APIResponse<BillPaymentResponse>> {
    console.log('[v0] Processing bill payment...')

    return this.fetchWithRetry<BillPaymentResponse>('/bills/pay', {
      method: 'POST',
      body: JSON.stringify({
        fromAccountId,
        payeeId,
        amount,
        paymentDate,
      }),
    })
  }

  /**
   * Deposit Check Remotely
   */
  async depositCheck(
    accountId: string,
    amount: number,
    checkNumber: string,
    routingNumber: string,
    accountNumber: string,
    frontImageUrl: string,
    backImageUrl: string
  ): Promise<APIResponse<CheckDepositResponse>> {
    console.log('[v0] Processing remote check deposit...')

    return this.fetchWithRetry<CheckDepositResponse>('/deposits/check', {
      method: 'POST',
      body: JSON.stringify({
        accountId,
        amount,
        checkNumber,
        routingNumber,
        accountNumber,
        frontImageUrl,
        backImageUrl,
      }),
    })
  }

  /**
   * Open New Account
   */
  async openAccount(
    accountType: string,
    initialDeposit: number
  ): Promise<APIResponse<AccountOpenResponse>> {
    console.log('[v0] Opening new account...')

    return this.fetchWithRetry<AccountOpenResponse>('/accounts/open', {
      method: 'POST',
      body: JSON.stringify({
        accountType,
        initialDeposit,
      }),
    })
  }

  /**
   * Link External Account
   */
  async linkExternalAccount(
    bankName: string,
    routingNumber: string,
    accountNumber: string,
    accountType: string
  ): Promise<APIResponse<{ linkedAccountId: string; status: string }>> {
    console.log('[v0] Linking external account...')

    return this.fetchWithRetry('/transfers/link-external', {
      method: 'POST',
      body: JSON.stringify({
        bankName,
        routingNumber,
        accountNumber,
        accountType,
      }),
    })
  }

  /**
   * Get Real-Time Balance
   */
  async getBalance(accountId: string): Promise<APIResponse<{ balance: number; available: number }>> {
    return this.fetchWithRetry(`/accounts/${accountId}/balance`)
  }

  /**
   * Get Recent Transactions
   */
  async getTransactions(accountId: string, days = 30): Promise<APIResponse<any[]>> {
    return this.fetchWithRetry(`/transactions?accountId=${accountId}&days=${days}`)
  }

  /**
   * Get Bills
   */
  async getBills(): Promise<APIResponse<any[]>> {
    return this.fetchWithRetry('/bills')
  }

  /**
   * Get Notifications
   */
  async getNotifications(): Promise<APIResponse<any[]>> {
    return this.fetchWithRetry('/notifications')
  }
}

// Export singleton instance
export const bankingAPIClient = new BankingAPIClient()
