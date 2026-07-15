'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useRef, useCallback } from 'react'

interface NavigationHistory {
  path: string
  timestamp: number
}

const MAX_HISTORY = 50

export function useNavigationHistory() {
  const router = useRouter()
  const pathname = usePathname()
  const historyRef = useRef<NavigationHistory[]>([])
  const isInitializedRef = useRef(false)

  // Initialize history from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitializedRef.current) {
      const stored = sessionStorage.getItem('navigationHistory')
      if (stored) {
        try {
          historyRef.current = JSON.parse(stored)
        } catch {
          historyRef.current = []
        }
      }
      isInitializedRef.current = true
    }
  }, [])

  // Add current path to history when it changes
  useEffect(() => {
    if (pathname && isInitializedRef.current) {
      // Don't add if it's the same as the last entry
      if (historyRef.current.length === 0 || historyRef.current[historyRef.current.length - 1].path !== pathname) {
        historyRef.current.push({
          path: pathname,
          timestamp: Date.now(),
        })

        // Keep history size under control
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current = historyRef.current.slice(-MAX_HISTORY)
        }

        // Persist to sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navigationHistory', JSON.stringify(historyRef.current))
        }
      }
    }
  }, [pathname])

  const goBack = useCallback(() => {
    if (historyRef.current.length > 1) {
      // Remove current entry
      historyRef.current.pop()
      // Get previous entry
      const previous = historyRef.current[historyRef.current.length - 1]
      
      if (previous) {
        // Persist updated history
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('navigationHistory', JSON.stringify(historyRef.current))
        }
        router.push(previous.path)
      }
    } else {
      // Fallback to dashboard if no history
      router.push('/dashboard')
    }
  }, [router])

  const goHome = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const getHistory = useCallback(() => {
    return historyRef.current
  }, [])

  const clearHistory = useCallback(() => {
    historyRef.current = []
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('navigationHistory')
    }
  }, [])

  return {
    goBack,
    goHome,
    getHistory,
    clearHistory,
    currentPath: pathname,
  }
}
