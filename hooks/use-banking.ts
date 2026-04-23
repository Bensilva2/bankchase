/**
 * useBanking Hook - Re-export from context for consistent banking operations
 */

'use client'

// Re-export everything from the banking context
export { 
  useBanking, 
  BankingProvider,
  BankingContext
} from "@/lib/banking-context"

// Hook for specific data types - all use the main hook
import { useBanking } from "@/lib/banking-context"

export function useBankingAccounts() {
  const context = useBanking()
  return { 
    accounts: context.accounts, 
    loading: false, 
    refresh: context.saveToStorage 
  }
}

export function useBankingTransactions() {
  const context = useBanking()
  return { 
    transactions: context.transactions, 
    loading: false, 
    refresh: context.saveToStorage 
  }
}

export function useBankingNotifications() {
  const context = useBanking()
  return { 
    notifications: context.notifications, 
    unreadNotifications: context.unreadNotificationCount, 
    loading: false, 
    markAsRead: context.markNotificationRead, 
    refresh: context.saveToStorage 
  }
}

export function useBankingBills() {
  const context = useBanking()
  return { 
    bills: [], 
    billsDueThisMonth: 0, 
    totalDueThisMonth: 0, 
    loading: false, 
    addBill: () => {}, 
    refresh: context.saveToStorage 
  }
}

export function useBankingCredit() {
  const context = useBanking()
  return { 
    credit: {}, 
    loading: false 
  }
}
