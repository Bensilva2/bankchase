'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Track navigation history on each page change
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname) {
      // Update navigation history
      const currentHistory = sessionStorage.getItem('navigationHistory')
      let history = []
      
      try {
        history = currentHistory ? JSON.parse(currentHistory) : []
      } catch {
        history = []
      }

      // Don't add if it's the same as the last entry
      if (history.length === 0 || history[history.length - 1].path !== pathname) {
        history.push({
          path: pathname,
          timestamp: Date.now(),
        })

        // Keep history size under control (max 50 entries)
        if (history.length > 50) {
          history = history.slice(-50)
        }

        sessionStorage.setItem('navigationHistory', JSON.stringify(history))
      }
    }
  }, [pathname])

  return <>{children}</>
}
