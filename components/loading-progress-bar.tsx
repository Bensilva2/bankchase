'use client'

import { useEffect, useState } from 'react'
import { usePageLoading } from '@/lib/page-loader'

export function LoadingProgressBar() {
  const { isLoading, progress } = usePageLoading()
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setOpacity(1)
    } else {
      const timer = setTimeout(() => setOpacity(0), 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-primary transition-opacity duration-300 z-50"
      style={{
        width: `${progress}%`,
        opacity,
      }}
    />
  )
}
