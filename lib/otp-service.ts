import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

interface OTPRecord {
  id: string
  email: string
  otp_code: string
  created_at: string
  expires_at: string
  attempt_count: number
  is_verified: boolean
}

export class OTPService {
  private supabase: any

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      console.warn('Supabase environment variables not configured')
      return
    }

    this.supabase = createClient(url, key)
  }

  /**
   * Generate a 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Send OTP to user email (implement with SendGrid, Resend, etc.)
   */
  async sendOTPEmail(email: string, code: string): Promise<void> {
    // TODO: Implement actual email sending
    console.log(`[v0] OTP for ${email}: ${code}`)
  }

  /**
   * Create OTP record in database
   */
  async createOTP(email: string): Promise<{ code: string; expiresAt: string }> {
    const code = this.generateOTP()
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10')
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()

    try {
      const { data, error } = await this.supabase
        .from('otp_codes')
        .insert([
          {
            email,
            otp_code: code,
            expires_at: expiresAt,
            attempt_count: 0,
            is_verified: false,
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      // Send OTP to email
      await this.sendOTPEmail(email, code)

      return { code, expiresAt }
    } catch (err: any) {
      console.error('Failed to create OTP:', err)
      throw new Error('Failed to create OTP')
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, code: string): Promise<boolean> {
    try {
      // Fetch the latest OTP for this email
      const { data, error } = await this.supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('otp_code', code)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        // Increment attempt count
        await this.incrementAttempts(email, code)
        return false
      }

      // Check attempt count (max 5 attempts)
      if (data.attempt_count >= 5) {
        return false
      }

      // Mark as verified
      const { error: updateError } = await this.supabase
        .from('otp_codes')
        .update({ is_verified: true })
        .eq('id', data.id)

      if (updateError) {
        throw updateError
      }

      return true
    } catch (err: any) {
      console.error('Failed to verify OTP:', err)
      return false
    }
  }

  /**
   * Increment failed attempt count
   */
  private async incrementAttempts(email: string, code: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('otp_codes')
        .select('id, attempt_count')
        .eq('email', email)
        .eq('otp_code', code)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        await this.supabase
          .from('otp_codes')
          .update({ attempt_count: data.attempt_count + 1 })
          .eq('id', data.id)
      }
    } catch (err) {
      console.error('Failed to increment attempts:', err)
    }
  }

  /**
   * Clean up expired OTP codes
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await this.supabase
        .from('otp_codes')
        .delete()
        .lt('expires_at', new Date().toISOString())
    } catch (err) {
      console.error('Failed to clean up OTPs:', err)
    }
  }
}

export const otpService = new OTPService()
