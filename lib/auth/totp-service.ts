/**
 * TOTP (Time-based One-Time Password) Service for 2FA
 * Compatible with Google Authenticator, Microsoft Authenticator, etc.
 */

import crypto from 'crypto'
import base32 from 'hi-base32'

export interface TOTPSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface TOTPVerification {
  valid: boolean
  message: string
}

/**
 * Generate a random secret key for TOTP
 */
export function generateTOTPSecret(length: number = 32): string {
  const randomBytes = crypto.randomBytes(Math.ceil(length * 5 / 8))
  return base32.encode(randomBytes).toString().replace(/=/g, '')
}

/**
 * Generate QR Code URL for authenticator app setup
 * Format: otpauth://totp/[issuer]:[accountName]?secret=[secret]&issuer=[issuer]
 */
export function generateQRCodeURL(
  secret: string,
  email: string,
  issuer: string = 'SecureBank'
): string {
  const encodedSecret = secret
  const encodedEmail = encodeURIComponent(email)
  const encodedIssuer = encodeURIComponent(issuer)

  return (
    `otpauth://totp/${encodedIssuer}:${encodedEmail}` +
    `?secret=${encodedSecret}` +
    `&issuer=${encodedIssuer}` +
    `&algorithm=SHA1` +
    `&digits=6` +
    `&period=30`
  )
}

/**
 * Generate QR Code using a free QR code API
 */
export async function generateQRCode(otpauthURL: string): Promise<string> {
  try {
    // Using a free QR code API
    const encodedURL = encodeURIComponent(otpauthURL)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedURL}`
  } catch (error) {
    console.error('[v0] Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Convert secret to base32 format for display
 */
export function formatSecretForDisplay(secret: string): string {
  // Add spaces every 4 characters for readability
  return secret.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Generate TOTP code from secret (6 digits, 30-second window)
 */
export function generateTOTPCode(secret: string, time?: number): string {
  const decodedSecret = base32.decode.asBytes(secret)
  let timeCounter = Math.floor((time || Date.now()) / 30000)

  // Convert time counter to bytes
  const buffer = Buffer.alloc(8)
  for (let i = 7; i >= 0; i--) {
    buffer[i] = timeCounter & 0xff
    // eslint-disable-next-line no-bitwise
    timeCounter = timeCounter >> 8
  }

  // Generate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', Buffer.from(decodedSecret))
  hmac.update(buffer)
  const digest = hmac.digest()

  // Extract 4 bytes using dynamic binary code
  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  // Return 6-digit code
  return (code % 1000000).toString().padStart(6, '0')
}

/**
 * Verify TOTP code with time window tolerance
 * Checks current time and ±1 time window (60 seconds total)
 */
export function verifyTOTPCode(
  secret: string,
  code: string,
  timeWindow: number = 1,
  currentTime?: number
): boolean {
  if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
    return false
  }

  const now = currentTime || Date.now()
  const timeCounter = Math.floor(now / 30000)

  // Check current time window and ±timeWindow windows
  for (let i = -timeWindow; i <= timeWindow; i++) {
    const testTime = (timeCounter + i) * 30000
    const testCode = generateTOTPCode(secret, testTime)

    if (testCode === code) {
      return true
    }
  }

  return false
}

/**
 * Generate backup codes (used if TOTP device is lost)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`)
  }
  return codes
}

/**
 * Verify backup code and remove it from list (one-time use)
 */
export function verifyAndRemoveBackupCode(
  usedCode: string,
  backupCodes: string[]
): { valid: boolean; remaining: string[] } {
  const normalizedCode = usedCode.replace(/\s+/g, '').toUpperCase()
  const codeIndex = backupCodes.findIndex(
    (code) => code.replace(/\s+/g, '').toUpperCase() === normalizedCode
  )

  if (codeIndex === -1) {
    return { valid: false, remaining: backupCodes }
  }

  const remaining = backupCodes.filter((_, index) => index !== codeIndex)
  return { valid: true, remaining }
}

/**
 * Hash backup codes for storage (similar to password hashing)
 */
export function hashBackupCodes(codes: string[]): string {
  return codes.map((code) => {
    const hash = crypto
      .createHash('sha256')
      .update(code.replace(/\s+/g, '').toUpperCase())
      .digest('hex')
    return hash
  }).join('|')
}

/**
 * Verify backup code against hashed codes
 */
export function verifyBackupCodeAgainstHash(
  code: string,
  hashedCodes: string
): boolean {
  const normalizedCode = code.replace(/\s+/g, '').toUpperCase()
  const codeHash = crypto
    .createHash('sha256')
    .update(normalizedCode)
    .digest('hex')

  return hashedCodes.split('|').some((hash) => hash === codeHash)
}

/**
 * Alias for verifyTOTPCode for consistency
 */
export const verifyTOTP = verifyTOTPCode
