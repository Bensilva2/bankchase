import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface VerificationSession {
  id: string
  user_id: string
  session_type: 'signup' | 'account_recovery' | 'security_verification'
  status: 'active' | 'completed' | 'failed' | 'expired'
  current_step: number
  attempts: number
  max_attempts: number
  created_at: string
  expires_at: string
}

export interface Microdeposit {
  id: string
  user_id: string
  deposit_amount_1: number
  deposit_amount_2: number
  attempts_remaining: number
  status: 'pending' | 'confirmed' | 'failed' | 'expired'
}

export class VerificationService {
  // Create a new verification session
  static async createSession(
    userId: string,
    sessionType: 'signup' | 'account_recovery' | 'security_verification',
    ipAddress?: string,
    userAgent?: string
  ): Promise<VerificationSession> {
    const { data, error } = await supabase
      .from('verification_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Generate microdeposits for account verification
  static async generateMicrodeposits(userId: string, sessionId: string): Promise<Microdeposit> {
    const amount1 = Math.random() * (0.99 - 0.01) + 0.01
    const amount2 = Math.random() * (0.99 - 0.01) + 0.01

    const { data, error } = await supabase
      .from('microdeposits')
      .insert({
        user_id: userId,
        verification_session_id: sessionId,
        deposit_amount_1: parseFloat(amount1.toFixed(2)),
        deposit_amount_2: parseFloat(amount2.toFixed(2)),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Confirm microdeposits
  static async confirmMicrodeposits(
    depositId: string,
    amount1: number,
    amount2: number
  ): Promise<{ success: boolean; message: string }> {
    const { data: deposit, error: fetchError } = await supabase
      .from('microdeposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (fetchError) throw fetchError

    // Check if amounts match (with 0.01 tolerance for rounding)
    const amount1Match = Math.abs(deposit.deposit_amount_1 - amount1) < 0.01
    const amount2Match = Math.abs(deposit.deposit_amount_2 - amount2) < 0.01

    if (amount1Match && amount2Match) {
      const { error: updateError } = await supabase
        .from('microdeposits')
        .update({
          status: 'confirmed',
          confirmed_amount_1: amount1,
          confirmed_amount_2: amount2,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', depositId)

      if (updateError) throw updateError

      // Mark verification method as verified
      await supabase
        .from('verification_methods')
        .insert({
          user_id: deposit.user_id,
          method_type: 'microdeposit',
          status: 'verified',
          verified_at: new Date().toISOString(),
          metadata: { deposit_id: depositId },
        })

      return { success: true, message: 'Microdeposits confirmed successfully' }
    } else {
      const newAttempts = deposit.attempts_remaining - 1
      await supabase
        .from('microdeposits')
        .update({
          attempts_remaining: newAttempts,
          status: newAttempts === 0 ? 'failed' : 'pending',
        })
        .eq('id', depositId)

      return {
        success: false,
        message: `Incorrect amounts. ${newAttempts} attempts remaining.`,
      }
    }
  }

  // Generate recovery codes
  static generateRecoveryCodes(count: number = 15): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase()
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
    }
    return codes
  }

  // Save recovery codes (hashed)
  static async saveRecoveryCodes(userId: string, codes: string[]): Promise<void> {
    const hashedCodes = codes.map((code) => ({
      user_id: userId,
      code_hash: crypto.createHash('sha256').update(code).digest('hex'),
    }))

    const { error } = await supabase.from('recovery_codes').insert(hashedCodes)

    if (error) throw error
  }

  // Verify recovery code
  static async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')

    const { data, error } = await supabase
      .from('recovery_codes')
      .select('id')
      .eq('user_id', userId)
      .eq('code_hash', codeHash)
      .eq('used_at', null)
      .single()

    if (error || !data) return false

    // Mark code as used
    await supabase
      .from('recovery_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', data.id)

    return true
  }

  // Update verification session
  static async updateSession(sessionId: string, updates: Partial<VerificationSession>): Promise<void> {
    const { error } = await supabase
      .from('verification_sessions')
      .update(updates)
      .eq('id', sessionId)

    if (error) throw error
  }

  // Get verification methods for user
  static async getVerificationMethods(userId: string) {
    const { data, error } = await supabase
      .from('verification_methods')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data
  }

  // Mark session as completed
  static async completeSession(sessionId: string): Promise<void> {
    await supabase
      .from('verification_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  }

  // Record analytics event
  static async recordAnalytics(event: {
    user_id?: string
    method_type?: string
    session_id?: string
    status: string
    duration_seconds: number
    error_reason?: string
  }): Promise<void> {
    const { error } = await supabase.from('verification_analytics').insert({
      ...event,
      timestamp: new Date().toISOString(),
    })

    if (error) console.error('Analytics recording error:', error)
  }
}
