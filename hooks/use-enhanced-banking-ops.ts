'use client'

import { useCallback } from 'react'
import { useBanking } from '@/lib/banking-context'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'
import type { SyncMessage } from '@/lib/realtime-sync-coordinator'

/**
 * Enhanced Banking Operations Hook
 * Wraps all banking operations with real-time synchronization
 * Ensures all drawer operations work smoothly together
 */

export function useEnhancedBankingOps(userId: string | null) {
  const context = useBanking()

  // Subscribe to real-time updates for all operations
  useRealtimeSync('accounts', (message: SyncMessage) => {
    console.log('[v0] Account sync update:', message)
    if (message.type === 'update' && message.data) {
      // Context will auto-update through local storage sync
    }
  })

  useRealtimeSync('transactions', (message: SyncMessage) => {
    console.log('[v0] Transaction sync update:', message)
    if (message.type === 'create' && message.data) {
      // New transaction added, context updates automatically
    }
  })

  useRealtimeSync('bills', (message: SyncMessage) => {
    console.log('[v0] Bill sync update:', message)
  })

  useRealtimeSync('notifications', (message: SyncMessage) => {
    console.log('[v0] Notification sync update:', message)
  })

  // Enhanced Send Money Operation
  const sendMoneyWithRealtime = useCallback(
    async (
      fromAccountId: string,
      toRecipient: string,
      amount: number,
      recipientName: string,
      method: 'zelle' | 'wire' = 'zelle'
    ) => {
      try {
        const response = await fetch('/api/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify({
            action: method,
            fromAccountId,
            amount,
            recipientEmail: method === 'zelle' ? toRecipient : undefined,
            recipientPhone: method === 'zelle' ? toRecipient : undefined,
            recipientName,
            recipientBank: method === 'wire' ? toRecipient : undefined,
            recipientRoutingNumber: method === 'wire' ? toRecipient : undefined,
            recipientAccountNumber: method === 'wire' ? toRecipient : undefined,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `${method} transfer failed`)
        }

        console.log('[v0] Money sent successfully:', result)

        // Update balance immediately for smooth UX
        context.updateBalance(fromAccountId, -amount, 'debit')

        // Add transaction
        const transaction = context.addTransaction({
          description: `${method.toUpperCase()} to ${recipientName}`,
          amount,
          type: 'debit',
          category: 'Transfers',
          status: 'completed',
          recipientName,
          reference: result.transferId || `${method.toUpperCase()}-${Date.now()}`,
        })

        // Notify user
        context.addNotification({
          title: 'Money Sent',
          message: `$${amount.toFixed(2)} sent via ${method.toUpperCase()}`,
          type: 'success',
          category: 'Transfers',
        })

        return { success: true, transaction, result }
      } catch (error) {
        console.error('[v0] Send money error:', error)

        context.addNotification({
          title: 'Transfer Failed',
          message: error instanceof Error ? error.message : 'Failed to send money',
          type: 'alert',
          category: 'Errors',
        })

        throw error
      }
    },
    [context, userId]
  )

  // Enhanced Internal Transfer
  const transferFundsWithRealtime = useCallback(
    async (
      fromAccountId: string,
      toAccountId: string,
      amount: number,
      description: string
    ) => {
      try {
        const response = await fetch('/api/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify({
            action: 'internal',
            fromAccountId,
            toAccountId,
            amount,
            description,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Transfer failed')
        }

        console.log('[v0] Internal transfer completed:', result)

        // Use context's built-in transfer function
        const transaction = context.transferFunds(
          fromAccountId,
          toAccountId,
          amount,
          description,
          0
        )

        context.addNotification({
          title: 'Transfer Complete',
          message: `$${amount.toFixed(2)} transferred successfully`,
          type: 'success',
          category: 'Transfers',
        })

        return { success: true, transaction, result }
      } catch (error) {
        console.error('[v0] Transfer error:', error)

        context.addNotification({
          title: 'Transfer Failed',
          message: error instanceof Error ? error.message : 'Transfer failed',
          type: 'alert',
          category: 'Errors',
        })

        throw error
      }
    },
    [context, userId]
  )

  // Enhanced Add Account
  const addAccountWithRealtime = useCallback(
    async (accountData: {
      type: string
      subtype?: string
      minBalance?: number
      interestRate?: number
      initialDeposit?: number
    }) => {
      try {
        const response = await fetch('/api/accounts/open', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify(accountData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to open account')
        }

        console.log('[v0] Account opened:', result)

        // Add to context
        context.addAccount({
          name: `${accountData.type}${accountData.subtype ? ' - ' + accountData.subtype : ''}`,
          type: accountData.type,
          balance: accountData.initialDeposit || 0,
          availableBalance: accountData.initialDeposit || 0,
          accountNumber: result.accountNumber,
          routingNumber: result.routingNumber,
          interestRate: accountData.interestRate,
        })

        context.addNotification({
          title: 'Account Created',
          message: `New ${accountData.type} account opened successfully`,
          type: 'success',
          category: 'Accounts',
        })

        return { success: true, result }
      } catch (error) {
        console.error('[v0] Add account error:', error)

        context.addNotification({
          title: 'Account Creation Failed',
          message: error instanceof Error ? error.message : 'Failed to create account',
          type: 'alert',
          category: 'Errors',
        })

        throw error
      }
    },
    [context, userId]
  )

  // Enhanced Pay Bill
  const payBillWithRealtime = useCallback(
    async (billData: {
      payeeId: string
      amount: number
      fromAccountId: string
      paymentDate: string
    }) => {
      try {
        const response = await fetch('/api/bills/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify(billData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Payment failed')
        }

        console.log('[v0] Bill payment processed:', result)

        // Update balance
        context.updateBalance(billData.fromAccountId, -billData.amount, 'debit')

        // Add transaction
        context.addTransaction({
          description: `Bill payment - ${result.payeeName}`,
          amount: billData.amount,
          type: 'debit',
          category: 'Bills',
          status: 'completed',
          reference: result.paymentId,
        })

        context.addNotification({
          title: 'Payment Sent',
          message: `$${billData.amount.toFixed(2)} payment processed`,
          type: 'success',
          category: 'Bills',
        })

        return { success: true, result }
      } catch (error) {
        console.error('[v0] Bill payment error:', error)

        context.addNotification({
          title: 'Payment Failed',
          message: error instanceof Error ? error.message : 'Payment failed',
          type: 'alert',
          category: 'Errors',
        })

        throw error
      }
    },
    [context, userId]
  )

  // Enhanced Deposit Check
  const depositCheckWithRealtime = useCallback(
    async (checkData: {
      accountId: string
      amount: number
      checkNumber: string
      routingNumber: string
      accountNumber: string
    }) => {
      try {
        const response = await fetch('/api/deposits/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify(checkData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Check deposit failed')
        }

        console.log('[v0] Check deposited:', result)

        // Add transaction with pending status initially
        context.addTransaction({
          description: `Mobile check deposit - Check #${checkData.checkNumber}`,
          amount: checkData.amount,
          type: 'credit',
          category: 'Deposits',
          status: 'pending',
          reference: result.depositId,
        })

        context.addNotification({
          title: 'Check Deposit Submitted',
          message: `$${checkData.amount.toFixed(2)} will be deposited in 1-2 business days`,
          type: 'info',
          category: 'Deposits',
        })

        return { success: true, result }
      } catch (error) {
        console.error('[v0] Check deposit error:', error)

        context.addNotification({
          title: 'Deposit Failed',
          message: error instanceof Error ? error.message : 'Check deposit failed',
          type: 'alert',
          category: 'Errors',
        })

        throw error
      }
    },
    [context, userId]
  )

  return {
    // Enhanced operations with real-time updates
    sendMoneyWithRealtime,
    transferFundsWithRealtime,
    addAccountWithRealtime,
    payBillWithRealtime,
    depositCheckWithRealtime,

    // Also expose original context methods for backward compatibility
    ...context,
  }
}
