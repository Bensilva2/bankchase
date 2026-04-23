/**
 * Centralized API Error Handler
 * Provides consistent error handling and responses across all API routes
 */

import { NextResponse } from 'next/server'

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isNetworkError: boolean = false
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Detect if an error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('net::ERR')
  )
}

/**
 * Handle API errors with appropriate HTTP responses
 */
export function handleAPIError(error: unknown): NextResponse {
  console.error('[v0] API Error:', error instanceof Error ? error.message : String(error))

  if (error instanceof APIError) {
    if (error.isNetworkError || isNetworkError(error)) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please check your internet connection and try again.' },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Check for network errors
  if (isNetworkError(error)) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please check your internet connection and try again.' },
      { status: 503 }
    )
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  )
}

/**
 * Wrap async route handlers with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleAPIError(error)
    }
  }) as T
}
