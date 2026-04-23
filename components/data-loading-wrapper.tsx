'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useDataLoaderWait } from '@/hooks/use-data-loader'

interface DataLoadingWrapperProps {
  children: React.ReactNode
  keys: string[]
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  timeout?: number
}

/**
 * Wrapper component that ensures data is loaded before rendering children
 */
export function DataLoadingWrapper({
  children,
  keys,
  loadingComponent,
  errorComponent,
  timeout = 10000,
}: DataLoadingWrapperProps) {
  const isReady = useDataLoaderWait(keys, timeout)
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        setIsTimedOut(true)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [isReady, timeout])

  if (!isReady) {
    if (isTimedOut) {
      return (
        errorComponent || (
          <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Loading Timeout</h2>
              <p className="text-sm text-red-700 mb-4">
                Data is taking longer than expected to load.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      )
    }

    return (
      loadingComponent || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a4fa6]/5 to-white">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a4fa6] to-[#083d80] rounded-full animate-spin" />
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-[#0a4fa6] animate-spin" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Loading Your Data</p>
              <p className="text-sm text-gray-600 mt-1">
                We're preparing everything for you...
              </p>
            </div>
            <div className="flex items-center justify-center gap-1">
              {keys.map((key, i) => (
                <div
                  key={key}
                  className="h-2 w-2 rounded-full bg-[#0a4fa6]"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}

/**
 * Hook version to check if data is loaded
 */
export function useIsDataLoaded(keys: string[], timeout?: number) {
  const isReady = useDataLoaderWait(keys, timeout)
  return isReady
}
