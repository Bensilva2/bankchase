'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Navigation utilities for proper routing without browser history issues
 */

export function useAppNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  const navigateTo = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const navigateToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const navigateToProfile = useCallback(() => {
    router.push('/profile')
  }, [router])

  const navigateToSettings = useCallback(() => {
    router.push('/settings')
  }, [router])

  const navigateToCards = useCallback(() => {
    router.push('/cards')
  }, [router])

  const navigateToTransactions = useCallback(() => {
    router.push('/transactions')
  }, [router])

  const navigateToSendMoney = useCallback(() => {
    router.push('/send-money')
  }, [router])

  const navigateToAccount = useCallback(() => {
    router.push('/account-management')
  }, [router])

  const navigateToBills = useCallback(() => {
    router.push('/bills')
  }, [router])

  const navigateToSavings = useCallback(() => {
    router.push('/savings')
  }, [router])

  const navigateToRewards = useCallback(() => {
    router.push('/rewards')
  }, [router])

  return {
    navigateTo,
    navigateToDashboard,
    navigateToProfile,
    navigateToSettings,
    navigateToCards,
    navigateToTransactions,
    navigateToSendMoney,
    navigateToAccount,
    navigateToBills,
    navigateToSavings,
    navigateToRewards,
    currentPath: pathname,
  }
}

/**
 * Get navigation history from session storage
 */
export function getNavigationHistory(): Array<{ path: string; timestamp: number }> {
  if (typeof window === 'undefined') return []
  
  const stored = sessionStorage.getItem('navigationHistory')
  try {
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear navigation history
 */
export function clearNavigationHistory() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('navigationHistory')
  }
}

/**
 * Get previous page from navigation history
 */
export function getPreviousPage(): string | null {
  const history = getNavigationHistory()
  if (history.length < 2) return null
  return history[history.length - 2]?.path || null
}

/**
 * Navigate to previous page or fallback
 */
export function navigateToPreviousPage(fallbackPath: string = '/dashboard') {
  const previous = getPreviousPage()
  if (previous) {
    window.location.href = previous
  } else {
    window.location.href = fallbackPath
  }
}
