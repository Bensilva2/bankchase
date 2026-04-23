/**
 * Supabase Error Handler
 * Provides consistent error handling for Supabase operations
 */

export interface SupabaseErrorResponse {
  error: string
  statusCode: number
  isNetworkError: boolean
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false

  const errorString = JSON.stringify(error).toLowerCase()
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''

  return (
    errorString.includes('fetch failed') ||
    errorString.includes('enotfound') ||
    errorString.includes('econnrefused') ||
    errorString.includes('econnreset') ||
    errorString.includes('timeout') ||
    errorString.includes('net::err') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('enotfound') ||
    errorMessage.includes('econnrefused')
  )
}

/**
 * Handle Supabase errors and provide user-friendly messages
 */
export function handleSupabaseError(error: unknown): SupabaseErrorResponse {
  // Network errors
  if (isNetworkError(error)) {
    return {
      error: 'Unable to connect to the service. Please check your internet connection.',
      statusCode: 503,
      isNetworkError: true,
    }
  }

  // Supabase auth errors
  const errorString = JSON.stringify(error)
  if (errorString.includes('invalid claim')) {
    return {
      error: 'Your session has expired. Please log in again.',
      statusCode: 401,
      isNetworkError: false,
    }
  }

  if (errorString.includes('duplicate')) {
    return {
      error: 'This account already exists. Please try logging in instead.',
      statusCode: 409,
      isNetworkError: false,
    }
  }

  if (errorString.includes('no rows')) {
    return {
      error: 'Invalid credentials. Please try again.',
      statusCode: 401,
      isNetworkError: false,
    }
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'An error occurred. Please try again.'
  return {
    error: message,
    statusCode: 500,
    isNetworkError: false,
  }
}

/**
 * Log Supabase errors for debugging
 */
export function logSupabaseError(context: string, error: unknown): void {
  console.error(`[v0] Supabase Error (${context}):`, error)
  if (error instanceof Error) {
    console.error('[v0] Stack:', error.stack)
  }
}
