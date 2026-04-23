'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useBanking } from '@/lib/banking-context'

/**
 * Real-Time Notification Hook
 * Handles push notifications, in-app alerts, and status updates
 * Automatically syncs across all tabs and devices
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'alert'
export type NotificationCategory = 'Transfers' | 'Bills' | 'Accounts' | 'Security' | 'Deposits' | 'Errors' | 'General'

export interface NotificationPayload {
  id?: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  actionUrl?: string
  actionLabel?: string
  timestamp?: number
  duration?: number // ms to auto-dismiss (0 = persistent)
}

export function useRealtimeNotifications() {
  const context = useBanking()
  const notificationQueueRef = useRef<NotificationPayload[]>([])
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)

  // Initialize broadcast channel for cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      broadcastChannelRef.current = new BroadcastChannel('banking-notifications')

      broadcastChannelRef.current.onmessage = (event) => {
        console.log('[v0] Notification from other tab:', event.data)

        if (event.data.type === 'notification') {
          const notification = event.data.payload as NotificationPayload
          // Add to context to show in current tab
          context.addNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type as any,
            category: notification.category as any,
          })
        }
      }

      return () => {
        broadcastChannelRef.current?.close()
      }
    } catch (error) {
      console.warn('[v0] BroadcastChannel not supported:', error)
    }
  }, [context])

  /**
   * Send notification and broadcast to other tabs
   */
  const notify = useCallback(
    (payload: NotificationPayload) => {
      console.log('[v0] Sending notification:', payload)

      // Add to context
      context.addNotification({
        title: payload.title,
        message: payload.message,
        type: payload.type as any,
        category: payload.category as any,
      })

      // Broadcast to other tabs
      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({
            type: 'notification',
            payload,
            timestamp: Date.now(),
          })
        } catch (error) {
          console.error('[v0] Failed to broadcast notification:', error)
        }
      }

      // Queue notification for processing
      notificationQueueRef.current.push(payload)
    },
    [context]
  )

  /**
   * Real-time notification for successful transfers
   */
  const notifyTransferSuccess = useCallback(
    (amount: number, recipientName: string, method: 'zelle' | 'wire' | 'internal' = 'zelle') => {
      const methodLabel = {
        zelle: 'Zelle',
        wire: 'Wire Transfer',
        internal: 'Transfer',
      }[method]

      notify({
        title: 'Money Sent Successfully',
        message: `$${amount.toFixed(2)} sent to ${recipientName} via ${methodLabel}`,
        type: 'success',
        category: 'Transfers',
        duration: 5000,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for transfer failures
   */
  const notifyTransferFailed = useCallback(
    (error: string, amount: number, recipientName: string) => {
      notify({
        title: 'Transfer Failed',
        message: `Failed to send $${amount.toFixed(2)} to ${recipientName}: ${error}`,
        type: 'error',
        category: 'Errors',
        duration: 7000,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for bill payments
   */
  const notifyBillPayment = useCallback(
    (amount: number, payeeName: string, status: 'pending' | 'completed' = 'completed') => {
      notify({
        title: status === 'completed' ? 'Payment Sent' : 'Payment Scheduled',
        message: `$${amount.toFixed(2)} payment to ${payeeName} ${status === 'completed' ? 'processed' : 'scheduled'}`,
        type: 'success',
        category: 'Bills',
        duration: 5000,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for account opened
   */
  const notifyAccountOpened = useCallback(
    (accountType: string, accountNumber: string) => {
      notify({
        title: 'Account Opened',
        message: `New ${accountType} account #${accountNumber.slice(-4)} is now active`,
        type: 'success',
        category: 'Accounts',
        duration: 5000,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for security alerts
   */
  const notifySecurityAlert = useCallback(
    (message: string, actionUrl?: string) => {
      notify({
        title: 'Security Alert',
        message,
        type: 'alert',
        category: 'Security',
        actionUrl,
        actionLabel: 'Review',
        duration: 0, // Persistent
      })
    },
    [notify]
  )

  /**
   * Real-time notification for check deposits
   */
  const notifyCheckDeposit = useCallback(
    (amount: number, checkNumber: string, estimatedDate: string) => {
      notify({
        title: 'Check Deposit Received',
        message: `Check #${checkNumber} for $${amount.toFixed(2)} will be deposited by ${estimatedDate}`,
        type: 'info',
        category: 'Deposits',
        duration: 5000,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for balance alerts
   */
  const notifyLowBalance = useCallback(
    (accountName: string, balance: number, threshold: number) => {
      notify({
        title: 'Low Balance Alert',
        message: `Your ${accountName} balance ($${balance.toFixed(2)}) is below your threshold of $${threshold.toFixed(2)}`,
        type: 'warning',
        category: 'General',
        duration: 0,
      })
    },
    [notify]
  )

  /**
   * Real-time notification for large transactions
   */
  const notifyLargeTransaction = useCallback(
    (amount: number, description: string) => {
      notify({
        title: 'Large Transaction Detected',
        message: `A transaction of $${amount.toFixed(2)} (${description}) has been processed. Verify if this was authorized.`,
        type: 'warning',
        category: 'Security',
        duration: 0,
      })
    },
    [notify]
  )

  /**
   * Batch notifications for multiple operations
   */
  const notifyBatch = useCallback(
    (notifications: NotificationPayload[]) => {
      notifications.forEach(notif => notify(notif))
    },
    [notify]
  )

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    context.clearAllNotifications()
    notificationQueueRef.current = []
  }, [context])

  return {
    // Generic notification
    notify,

    // Specific notifications
    notifyTransferSuccess,
    notifyTransferFailed,
    notifyBillPayment,
    notifyAccountOpened,
    notifySecurityAlert,
    notifyCheckDeposit,
    notifyLowBalance,
    notifyLargeTransaction,
    notifyBatch,
    clearAll,

    // Getters
    getQueuedNotifications: () => [...notificationQueueRef.current],
  }
}
