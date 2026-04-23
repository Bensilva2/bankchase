/**
 * useBanking Hook - Real-time banking data and operations with API integration
 */

'use client'

import { useEffect, useCallback, useState } from 'react'
import { getBankingIntegration } from '@/lib/banking-integration'
import useSWR from 'swr'

// Re-export existing hook
export { useBanking as useBankingContext } from "@/lib/banking-context"

const fetcher = (url: string) =>
  fetch(url, {
    headers: {
      'x-user-id': localStorage.getItem('userId') || ''
    }
  }).then(r => r.json())

export function useBanking(userId?: string) {
  const integration = getBankingIntegration()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize banking integration
  useEffect(() => {
    const currentUserId = userId || localStorage.getItem('userId')
    if (currentUserId && !isInitialized) {
      integration.initialize(currentUserId)
      setIsInitialized(true)
    }

    return () => {
      // Cleanup on unmount
    }
  }, [userId, integration, isInitialized])

  // Fetch accounts with real-time updates
  const { data: accountsData, mutate: mutateAccounts } = useSWR(
    isInitialized ? '/api/accounts' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )

  // Fetch transactions with real-time updates
  const { data: transactionsData, mutate: mutateTransactions } = useSWR(
    isInitialized ? '/api/transactions?days=30' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 }
  )

  // Fetch notifications
  const { data: notificationsData, mutate: mutateNotifications } = useSWR(
    isInitialized ? '/api/notifications' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 10000 }
  )

  // Fetch bills
  const { data: billsData, mutate: mutateBills } = useSWR(
    isInitialized ? '/api/bill-pay' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 120000 }
  )

  // Fetch credit info
  const { data: creditData, mutate: mutateCredit } = useSWR(
    isInitialized ? '/api/credit' : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 86400000 } // 24 hours
  )

  // Fetch settings
  const { data: settingsData, mutate: mutateSettings } = useSWR(
    isInitialized ? '/api/settings' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Wire transfer
  const sendWire = useCallback(async (
    fromAccountId: string,
    amount: number,
    recipientName: string,
    recipientBank: string,
    recipientRoutingNumber: string,
    recipientAccountNumber: string
  ) => {
    const result = await integration.sendWire(
      fromAccountId,
      amount,
      recipientName,
      recipientBank,
      recipientRoutingNumber,
      recipientAccountNumber
    )
    mutateAccounts()
    mutateTransactions()
    return result
  }, [integration, mutateAccounts, mutateTransactions])

  // Zelle transfer
  const sendZelle = useCallback(async (
    fromAccountId: string,
    amount: number,
    recipientEmail: string,
    recipientName: string
  ) => {
    const result = await integration.sendZelle(
      fromAccountId,
      amount,
      recipientEmail,
      recipientName
    )
    mutateAccounts()
    mutateTransactions()
    return result
  }, [integration, mutateAccounts, mutateTransactions])

  // Add bill
  const addBill = useCallback(async (billData: any) => {
    const result = await integration.addBill(billData)
    mutateBills()
    return result
  }, [integration, mutateBills])

  // Create transfer
  const createTransfer = useCallback(async (transferData: any) => {
    const result = await integration.createTransfer(transferData)
    mutateAccounts()
    mutateTransactions()
    return result
  }, [integration, mutateAccounts, mutateTransactions])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    await integration.markNotificationAsRead(notificationId)
    mutateNotifications()
  }, [integration, mutateNotifications])

  // Update settings
  const updateSettings = useCallback(async (settings: any) => {
    const result = await integration.updateSettings(settings)
    mutateSettings()
    return result
  }, [integration, mutateSettings])

  return {
    // Data
    accounts: accountsData?.accounts || [],
    transactions: transactionsData?.transactions || [],
    notifications: notificationsData?.notifications || [],
    bills: billsData?.bills || [],
    credit: creditData,
    settings: settingsData,

    // Metadata
    accountsCount: accountsData?.count || 0,
    totalBalance: accountsData?.totalBalance || 0,
    unreadNotifications: notificationsData?.unreadCount || 0,
    billsDueThisMonth: billsData?.thisMonth || 0,
    totalDueThisMonth: billsData?.totalDueThisMonth || 0,

    // Operations
    sendWire,
    sendZelle,
    addBill,
    createTransfer,
    markAsRead,
    updateSettings,

    // Refresh
    refresh: async () => {
      await Promise.all([
        mutateAccounts(),
        mutateTransactions(),
        mutateNotifications(),
        mutateBills(),
        mutateCredit(),
        mutateSettings()
      ])
    },

    // Loading states
    loading: !accountsData || !transactionsData || !notificationsData,
    isInitialized
  }
}

// Hook for specific data types
export function useBankingAccounts() {
  const { accounts, loading, refresh } = useBanking()
  return { accounts, loading, refresh }
}

export function useBankingTransactions() {
  const { transactions, loading, refresh } = useBanking()
  return { transactions, loading, refresh }
}

export function useBankingNotifications() {
  const { notifications, unreadNotifications, loading, markAsRead, refresh } = useBanking()
  return { notifications, unreadNotifications, loading, markAsRead, refresh }
}

export function useBankingBills() {
  const { bills, billsDueThisMonth, totalDueThisMonth, loading, addBill, refresh } = useBanking()
  return { bills, billsDueThisMonth, totalDueThisMonth, loading, addBill, refresh }
}

export function useBankingCredit() {
  const { credit, loading } = useBanking()
  return { credit, loading }
}
