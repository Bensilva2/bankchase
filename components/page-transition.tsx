'use client'

import { ReactNode, useEffect, useState, Suspense } from 'react'
import { usePageLoading } from '@/lib/page-loader'

interface PageTransitionProps {
  children: ReactNode
  delay?: number
}

export function PageTransition({ children, delay = 300 }: PageTransitionProps) {
  const { startLoading, completeLoading, updateProgress } = usePageLoading()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    startLoading(30)

    const progressTimer = setInterval(() => {
      updateProgress((prev) => {
        const next = prev + Math.random() * 40
        return Math.min(next, 90)
      })
    }, 300)

    const readyTimer = setTimeout(() => {
      completeLoading()
      setIsReady(true)
    }, delay)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(readyTimer)
    }
  }, [delay, startLoading, completeLoading, updateProgress])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading page...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
