'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { pageLoader } from '@/lib/page-loader'

export function useNavigationLoading() {
  const router = useRouter()
  const pathname = usePathname()
  const isNavigatingRef = useRef(false)

  // Monitor path changes
  useEffect(() => {
    pageLoader.completeLoading()
  }, [pathname])

  const navigate = useCallback(
    (url: string) => {
      if (isNavigatingRef.current) return

      isNavigatingRef.current = true
      pageLoader.startLoading(10)

      // Simulate progress while navigating
      const progressInterval = setInterval(() => {
        pageLoader.updateProgress((prev) => {
          const next = prev + Math.random() * 30
          return Math.min(next, 85)
        })
      }, 200)

      // Navigate
      router.push(url)

      // Cleanup on next path change
      const cleanup = () => {
        clearInterval(progressInterval)
        isNavigatingRef.current = false
      }

      return cleanup
    },
    [router]
  )

  return { navigate, isNavigating: isNavigatingRef.current }
}
