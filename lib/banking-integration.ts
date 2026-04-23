/**
 * Banking Integration Service
 * Central hub for all banking APIs and real-time data synchronization
 */

import { createClient } from './supabase/client'

export class BankingIntegrationService {
  private supabase = createClient()
  private userId: string | null = null
  private syncInterval: NodeJS.Timeout | null = null

  constructor(userId: string | null = null) {
    this.userId = userId
  }

  /**
   * Initialize banking integration and start real-time sync
   */
  async initialize(userId: string) {
    this.userId = userId
    console.log('[v0] Banking integration initialized for user:', userId)
    this.startRealTimeSync()
  }

  /**
   * Start real-time sync of banking data (every 30 seconds)
   */
  private startRealTimeSync() {
    if (this.syncInterval) clearInterval(this.syncInterval)

    this.syncInterval = setInterval(async () => {
      if (this.userId) {
        await this.syncAllData()
      }
    }, 30000) // Sync every 30 seconds
  }

  /**
   * Sync all banking data
   */
  async syncAllData() {
    if (!this.userId) return

    try {
      const [accounts, transactions, notifications] = await Promise.all([
        this.fetchAccounts(),
        this.fetchTransactions(),
        this.fetchNotifications(),
      ])

      // Broadcast update event
      const event = new CustomEvent('banking-sync', {
        detail: { accounts, transactions, notifications }
      })
      window.dispatchEvent(event)

      console.log('[v0] Banking data synced')
    } catch (error) {
      console.error('[v0] Sync error:', error)
    }
  }

  /**
   * Fetch all accounts with balances
   */
  async fetchAccounts() {
    try {
      const response = await fetch('/api/accounts', {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch accounts error:', error)
      return { accounts: [] }
    }
  }

  /**
   * Fetch transactions
   */
  async fetchTransactions(days = 30) {
    try {
      const response = await fetch(`/api/transactions?days=${days}`, {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch transactions error:', error)
      return { transactions: [] }
    }
  }

  /**
   * Fetch notifications
   */
  async fetchNotifications() {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch notifications error:', error)
      return { notifications: [] }
    }
  }

  /**
   * Create transfer (wire, Zelle, ACH, internal, bill pay)
   */
  async createTransfer(transferData: {
    action: 'wire' | 'zelle' | 'ach' | 'internal' | 'bill_pay'
    fromAccountId: string
    toAccountId?: string
    amount: number
    description?: string
    recipientEmail?: string
    recipientPhone?: string
    recipientName?: string
    recipientBank?: string
    recipientRoutingNumber?: string
    recipientAccountNumber?: string
    scheduledDate?: string
    frequency?: string
    billPayee?: string
    billDueDate?: string
  }) {
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId || ''
        },
        body: JSON.stringify(transferData)
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Transfer error:', error)
      throw error
    }
  }

  /**
   * Send Zelle transfer
   */
  async sendZelle(fromAccountId: string, amount: number, recipientEmail: string, recipientName: string) {
    return this.createTransfer({
      action: 'zelle',
      fromAccountId,
      amount,
      recipientEmail,
      recipientName
    })
  }

  /**
   * Create wire transfer
   */
  async sendWire(
    fromAccountId: string,
    amount: number,
    recipientName: string,
    recipientBank: string,
    recipientRoutingNumber: string,
    recipientAccountNumber: string
  ) {
    return this.createTransfer({
      action: 'wire',
      fromAccountId,
      amount,
      recipientName,
      recipientBank,
      recipientRoutingNumber,
      recipientAccountNumber
    })
  }

  /**
   * Get bills for user
   */
  async getBills() {
    try {
      const response = await fetch('/api/bill-pay', {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch bills error:', error)
      return { bills: [] }
    }
  }

  /**
   * Add bill
   */
  async addBill(billData: {
    accountId: string
    payee: string
    amount: number
    category: string
    dueDate: string
    frequency: string
    accountNumber?: string
  }) {
    try {
      const response = await fetch('/api/bill-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId || ''
        },
        body: JSON.stringify(billData)
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Add bill error:', error)
      throw error
    }
  }

  /**
   * Get credit information
   */
  async getCreditInfo() {
    try {
      const response = await fetch('/api/credit', {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch credit error:', error)
      return {}
    }
  }

  /**
   * Get user settings
   */
  async getSettings() {
    try {
      const response = await fetch('/api/settings', {
        headers: {
          'x-user-id': this.userId || ''
        }
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Fetch settings error:', error)
      return {}
    }
  }

  /**
   * Update settings
   */
  async updateSettings(settings: any) {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId || ''
        },
        body: JSON.stringify(settings)
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Update settings error:', error)
      throw error
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId || ''
        },
        body: JSON.stringify({ notificationId })
      })
      return await response.json()
    } catch (error) {
      console.error('[v0] Mark notification error:', error)
      throw error
    }
  }

  /**
   * Cleanup and stop syncing
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    this.userId = null
    console.log('[v0] Banking integration destroyed')
  }
}

// Singleton instance
let instance: BankingIntegrationService | null = null

export function getBankingIntegration() {
  if (!instance) {
    instance = new BankingIntegrationService()
  }
  return instance
}
