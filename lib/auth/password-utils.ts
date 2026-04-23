/**
 * Password utility functions for secure authentication
 * Uses bcrypt-like hashing (browser-safe implementation)
 */

import crypto from 'crypto'

/**
 * Hash password with salt (Node.js server-side)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 32, 'sha256')
    .toString('hex')
  return `${salt}.${hash}`
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split('.')
  const hash2 = crypto
    .pbkdf2Sync(password, salt, 1000, 32, 'sha256')
    .toString('hex')
  return hash2 === storedHash
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isStrong: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isStrong: errors.length === 0,
    errors,
  }
}

/**
 * Generate random OTP
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}

/**
 * Generate 2FA backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
  }
  return codes
}
