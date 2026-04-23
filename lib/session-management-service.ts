/**
 * Session Management Service
 * Handles real-time session tracking, device management, and cross-device notifications
 */

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SessionInfo {
  id: string
  userId: string
  device: string
  browser: string
  os: string
  location: string
  ip: string
  lastActive: string
  createdAt: string
  trusted: boolean
  isCurrent?: boolean
}

export interface DeviceFingerprint {
  userId: string
  deviceId: string
  userAgent: string
  deviceName: string
  ip: string
  location: string
  firstSeen: string
  lastSeen: string
  trustLevel: 'low' | 'medium' | 'high'
}

export class SessionManagementService {
  /**
   * Create a new session
   */
  static async createSession(
    userId: string,
    email: string,
    deviceInfo: {
      name: string
      browser: string
      os: string
      ip: string
      location: string
    }
  ): Promise<SessionInfo> {
    const supabase = await createClient()
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    const session: SessionInfo = {
      id: sessionId,
      userId,
      device: deviceInfo.name,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location: deviceInfo.location,
      ip: deviceInfo.ip,
      lastActive: now,
      createdAt: now,
      trusted: false,
    }

    // Store session in database
    const { error } = await supabase.from('sessions').insert([
      {
        id: sessionId,
        user_id: userId,
        device_name: deviceInfo.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location,
        ip: deviceInfo.ip,
        last_active: now,
        created_at: now,
        trusted: false,
      },
    ])

    if (error) {
      console.error('[v0] Failed to create session:', error)
    }

    // Check if this is a new device
    const isNewDevice = await this.isNewDevice(userId, deviceInfo.ip)

    // Send real-time notification if new device
    if (isNewDevice) {
      await this.sendNewDeviceAlert(userId, email, deviceInfo, sessionId)
    }

    return session
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(sessionId: string): Promise<void> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('sessions')
      .update({ last_active: now })
      .eq('id', sessionId)

    if (error) {
      console.error('[v0] Failed to update session activity:', error)
    }
  }

  /**
   * Get all active sessions for user
   */
  static async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    const supabase = await createClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('last_active', oneHourAgo)
      .order('last_active', { ascending: false })

    if (error) {
      console.error('[v0] Failed to fetch active sessions:', error)
      return []
    }

    return (
      data?.map((session: any) => ({
        id: session.id,
        userId: session.user_id,
        device: session.device_name,
        browser: session.browser,
        os: session.os,
        location: session.location,
        ip: session.ip,
        lastActive: session.last_active,
        createdAt: session.created_at,
        trusted: session.trusted,
      })) || []
    )
  }

  /**
   * Terminate a session
   */
  static async terminateSession(sessionId: string, email: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { data: sessionData, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!fetchError && sessionData) {
      // Mark as terminated
      await supabase.from('sessions').update({ terminated_at: new Date().toISOString() }).eq('id', sessionId)

      // Send session terminated notification
      await this.sendSessionTerminatedAlert(
        userId,
        email,
        {
          device: sessionData.device_name,
          location: sessionData.location,
          ip: sessionData.ip,
        }
      )
    }
  }

  /**
   * Logout all sessions except current
   */
  static async logoutAllExcept(userId: string, email: string, currentSessionId: string): Promise<number> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .neq('id', currentSessionId)
      .is('terminated_at', null)

    if (fetchError || !sessions) {
      console.error('[v0] Failed to fetch sessions for logout:', fetchError)
      return 0
    }

    // Terminate all other sessions
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ terminated_at: now })
      .eq('user_id', userId)
      .neq('id', currentSessionId)
      .is('terminated_at', null)

    if (updateError) {
      console.error('[v0] Failed to logout all sessions:', updateError)
      return 0
    }

    // Send notification
    await this.sendLogoutAllAlert(userId, email, sessions.length)

    return sessions.length
  }

  /**
   * Check if device is new
   */
  private static async isNewDevice(userId: string, ip: string): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sessions')
      .select('ip')
      .eq('user_id', userId)
      .eq('ip', ip)
      .limit(1)

    if (error) {
      console.error('[v0] Failed to check device:', error)
      return true // Treat as new if check fails
    }

    return !data || data.length === 0
  }

  /**
   * Send new device alert via Resend
   */
  private static async sendNewDeviceAlert(
    userId: string,
    email: string,
    deviceInfo: { name: string; browser: string; os: string; ip: string; location: string },
    sessionId: string
  ): Promise<void> {
    try {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0066CC; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">New Device Detected</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>A new device has signed into your account.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Device Information</h3>
              <p><strong>Device:</strong> ${deviceInfo.name}</p>
              <p><strong>Browser:</strong> ${deviceInfo.browser}</p>
              <p><strong>Operating System:</strong> ${deviceInfo.os}</p>
              <p><strong>Location:</strong> ${deviceInfo.location}</p>
              <p><strong>IP Address:</strong> ${deviceInfo.ip}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>If this was you, you can ignore this message. If it wasn't, please secure your account immediately.</p>

            <p style="text-align: center;">
              <a href="https://yourapp.com/security/devices" style="background: #0066CC; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                Review Devices
              </a>
            </p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: 'security@resend.dev',
        to: email,
        subject: 'New Device Detected on Your Account',
        html,
        replyTo: 'security@yourdomain.com',
      })

      console.log('[v0] New device alert sent to', email)
    } catch (error) {
      console.error('[v0] Failed to send new device alert:', error)
    }
  }

  /**
   * Send session terminated alert
   */
  private static async sendSessionTerminatedAlert(
    userId: string,
    email: string,
    sessionInfo: { device: string; location: string; ip: string }
  ): Promise<void> {
    try {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #EA580C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Session Ended</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>A session on your account has been terminated.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Session Information</h3>
              <p><strong>Device:</strong> ${sessionInfo.device}</p>
              <p><strong>Location:</strong> ${sessionInfo.location}</p>
              <p><strong>IP Address:</strong> ${sessionInfo.ip}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p style="text-align: center;">
              <a href="https://yourapp.com/settings/security" style="background: #EA580C; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                Manage Sessions
              </a>
            </p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: 'security@resend.dev',
        to: email,
        subject: 'Session Ended on Your Account',
        html,
        replyTo: 'security@yourdomain.com',
      })

      console.log('[v0] Session terminated alert sent to', email)
    } catch (error) {
      console.error('[v0] Failed to send session terminated alert:', error)
    }
  }

  /**
   * Send logout all alert
   */
  private static async sendLogoutAllAlert(
    userId: string,
    email: string,
    terminatedCount: number
  ): Promise<void> {
    try {
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">🔒 Security Alert</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>You've been logged out from all devices except your current one.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Sessions Terminated:</strong> ${terminatedCount}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>This action was taken for your security. If you didn't initiate this, please change your password immediately.</p>

            <p style="text-align: center;">
              <a href="https://yourapp.com/security/sessions" style="background: #DC2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                View Active Sessions
              </a>
            </p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: 'security@resend.dev',
        to: email,
        subject: '🔒 All Sessions Terminated',
        html,
        replyTo: 'security@yourdomain.com',
      })

      console.log('[v0] Logout all alert sent to', email)
    } catch (error) {
      console.error('[v0] Failed to send logout all alert:', error)
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(userId: string): Promise<{
    totalSessions: number
    activeSessions: number
    trustedDevices: number
    uniqueLocations: number
  }> {
    const supabase = await createClient()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .is('terminated_at', null)

    if (error || !sessions) {
      console.error('[v0] Failed to fetch session stats:', error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        trustedDevices: 0,
        uniqueLocations: 0,
      }
    }

    const activeSessions = sessions.filter(s => new Date(s.last_active) > new Date(oneHourAgo))
    const trustedDevices = sessions.filter(s => s.trusted)
    const uniqueLocations = [...new Set(sessions.map(s => s.location))]

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      trustedDevices: trustedDevices.length,
      uniqueLocations: uniqueLocations.length,
    }
  }
}
