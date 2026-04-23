/**
 * OTP (One-Time Password) Service for 2FA
 */

import { generateOTP } from './password-utils'

export interface OTPSession {
  code: string
  expiresAt: number
  attempts: number
  maxAttempts: number
}

// In-memory storage (in production, use Redis or database)
const otpSessions = new Map<string, OTPSession>()

/**
 * Generate and store OTP
 */
export function generateAndStoreOTP(
  userId: string,
  expiryMinutes: number = 5,
  maxAttempts: number = 3
): string {
  const code = generateOTP(6)
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000

  otpSessions.set(userId, {
    code,
    expiresAt,
    attempts: 0,
    maxAttempts,
  })

  return code
}

/**
 * Verify OTP code
 */
export function verifyOTP(userId: string, code: string): boolean {
  const session = otpSessions.get(userId)

  if (!session) {
    return false
  }

  // Check if expired
  if (Date.now() > session.expiresAt) {
    otpSessions.delete(userId)
    return false
  }

  // Check attempts
  if (session.attempts >= session.maxAttempts) {
    otpSessions.delete(userId)
    return false
  }

  session.attempts++

  if (session.code === code) {
    otpSessions.delete(userId)
    return true
  }

  return false
}

/**
 * Get remaining OTP attempts
 */
export function getOTPAttempts(userId: string): { remaining: number; total: number } {
  const session = otpSessions.get(userId)

  if (!session) {
    return { remaining: 0, total: 0 }
  }

  return {
    remaining: Math.max(0, session.maxAttempts - session.attempts),
    total: session.maxAttempts,
  }
}

/**
 * Clear OTP session
 */
export function clearOTPSession(userId: string): void {
  otpSessions.delete(userId)
}
