"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] App error caught:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-1 text-sm">{error.message}</p>
        <pre className="text-xs text-left bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 mb-4 text-gray-500">
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-[#0a4fa6] text-white rounded-lg font-medium hover:bg-[#083d85] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
