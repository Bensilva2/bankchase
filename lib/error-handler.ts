/**
 * Centralized error handling for API calls and forms
 */

export interface ApiError {
  status: number
  message: string
  field?: string
  code?: string
}

export class ApiErrorHandler {
  /**
   * Parse error response from API
   */
  static async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json()
      return {
        status: response.status,
        message: data.error || data.message || 'An error occurred',
        field: data.field,
        code: data.code,
      }
    } catch {
      return {
        status: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
      }
    }
  }

  /**
   * Handle common API errors with user-friendly messages
   */
  static getErrorMessage(error: ApiError | Error | unknown): string {
    if (error instanceof ApiError) {
      return error.message
    }

    if (error instanceof Response) {
      const status = error.status
      switch (status) {
        case 400:
          return 'Invalid input. Please check your information and try again.'
        case 401:
          return 'Your session has expired. Please log in again.'
        case 403:
          return 'You do not have permission to perform this action.'
        case 404:
          return 'The requested resource was not found.'
        case 409:
          return 'This action conflicts with existing data. Please refresh and try again.'
        case 422:
          return 'Please check your input and try again.'
        case 429:
          return 'Too many requests. Please try again later.'
        case 500:
          return 'Server error. Please try again later.'
        case 503:
          return 'Service is temporarily unavailable. Please try again later.'
        case 504:
          return 'Request timeout. Please try again.'
        default:
          return 'An unexpected error occurred. Please try again.'
      }
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return 'Request timeout. Please try again.'
      }
      return error.message || 'An unexpected error occurred'
    }

    return 'An unexpected error occurred'
  }

  /**
   * Validate form field
   */
  static validateField(
    name: string,
    value: string | number,
    type: 'email' | 'phone' | 'zip' | 'pin' | 'text' | 'number' = 'text'
  ): string | null {
    const trimmedValue = String(value).trim()

    if (!trimmedValue) {
      return `${name} is required`
    }

    switch (type) {
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedValue)) {
          return 'Please enter a valid email address'
        }
        break
      }

      case 'phone': {
        const phoneRegex = /^[\d\-\(\)\s]+$/
        if (!phoneRegex.test(trimmedValue) || trimmedValue.replace(/\D/g, '').length < 10) {
          return 'Please enter a valid phone number'
        }
        break
      }

      case 'zip': {
        const zipRegex = /^\d{5}(-\d{4})?$/
        if (!zipRegex.test(trimmedValue)) {
          return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
        }
        break
      }

      case 'pin': {
        if (!/^\d{4}$/.test(trimmedValue)) {
          return 'PIN must be exactly 4 digits'
        }
        break
      }

      case 'number': {
        const num = Number(value)
        if (isNaN(num) || num <= 0) {
          return `${name} must be a positive number`
        }
        break
      }
    }

    return null
  }

  /**
   * Validate entire form
   */
  static validateForm(
    formData: Record<string, any>,
    rules: Record<string, 'email' | 'phone' | 'zip' | 'pin' | 'text' | 'number'>
  ): Record<string, string> {
    const errors: Record<string, string> = {}

    Object.entries(rules).forEach(([field, type]) => {
      const error = this.validateField(field, formData[field], type)
      if (error) {
        errors[field] = error
      }
    })

    return errors
  }
}

/**
 * Network error detection
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to')
    )
  }
  return false
}

/**
 * Format amount for currency display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
