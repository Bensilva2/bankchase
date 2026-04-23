/**
 * Anomaly Detection Service
 * Real-time detection of suspicious login patterns and security threats
 */

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface AnomalyScore {
  score: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  flags: string[]
  details: string[]
}

export class AnomalyDetectionService {
  /**
   * Analyze login attempt for anomalies
   */
  static async analyzeLoginAttempt(
    userId: string,
    email: string,
    loginData: {
      ip: string
      location: {
        country: string
        city: string
        latitude: number
        longitude: number
        timezone: string
      }
      userAgent: string
      deviceName: string
      timestamp: string
    }
  ): Promise<AnomalyScore> {
    const supabase = await createClient()
    const flags: string[] = []
    const details: string[] = []
    let score = 0

    try {
      // 1. Check for impossible travel
      const { data: recentLogins } = await supabase
        .from('login_history')
        .select('location_data, timestamp')
        .eq('user_id', userId)
        .eq('login_success', true)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (recentLogins && recentLogins.length > 0) {
        const lastLogin = recentLogins[0]
        if (this.isImpossibleTravel(lastLogin.location_data, loginData.location, lastLogin.timestamp, loginData.timestamp)) {
          flags.push('impossible_travel')
          score += 25
          details.push('Login detected from geographically impossible location')
        }
      }

      // 2. Check for new location/country
      const { data: locationHistory } = await supabase
        .from('login_history')
        .select('location_data')
        .eq('user_id', userId)
        .eq('login_success', true)
        .limit(10)

      if (locationHistory && locationHistory.length > 0) {
        const previousCountries = locationHistory.map(l => l.location_data?.country)
        if (!previousCountries.includes(loginData.location.country)) {
          flags.push('new_country')
          score += 15
          details.push(`Login from new country: ${loginData.location.country}`)
        }

        const previousCities = locationHistory.map(l => l.location_data?.city)
        if (!previousCities.includes(loginData.location.city)) {
          flags.push('new_city')
          score += 10
          details.push(`Login from new city: ${loginData.location.city}`)
        }
      }

      // 3. Check login time anomaly (unusual hours for user)
      const loginHour = new Date(loginData.timestamp).getHours()
      const { data: timeHistory } = await supabase
        .from('login_history')
        .select('timestamp')
        .eq('user_id', userId)
        .eq('login_success', true)
        .limit(20)

      if (timeHistory && timeHistory.length > 0) {
        const usualHours = timeHistory.map(l => new Date(l.timestamp).getHours())
        const avgHour = Math.round(usualHours.reduce((a, b) => a + b, 0) / usualHours.length)
        
        if (Math.abs(loginHour - avgHour) > 6) {
          flags.push('unusual_time')
          score += 10
          details.push(`Login at unusual hour: ${loginHour}:00 (usual: ${avgHour}:00)`)
        }
      }

      // 4. Check for VPN/Proxy usage
      if (this.isLikelyVPN(loginData.ip)) {
        flags.push('vpn_detected')
        score += 15
        details.push('Login detected through VPN or proxy')
      }

      // 5. Check for rapid successive logins
      const { data: recentAttempts } = await supabase
        .from('login_history')
        .select('timestamp')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString())

      if (recentAttempts && recentAttempts.length > 3) {
        flags.push('rapid_logins')
        score += 15
        details.push(`${recentAttempts.length} login attempts in last 15 minutes`)
      }

      // 6. Check for new device/user agent
      const { data: deviceHistory } = await supabase
        .from('login_history')
        .select('user_agent')
        .eq('user_id', userId)
        .eq('login_success', true)
        .limit(10)

      if (deviceHistory && deviceHistory.length > 0) {
        const previousAgents = deviceHistory.map(d => d.user_agent)
        if (!previousAgents.includes(loginData.userAgent)) {
          flags.push('new_device')
          score += 12
          details.push('Login from new device')
        }
      }

      // 7. Check for known bad IPs
      if (this.isKnownMaliciousIP(loginData.ip)) {
        flags.push('known_malicious_ip')
        score += 30
        details.push('Login from known malicious IP address')
      }

      // 8. Check failed login attempts before success
      const { data: failedAttempts } = await supabase
        .from('login_history')
        .select('timestamp')
        .eq('user_id', userId)
        .eq('login_success', false)
        .gte('timestamp', new Date(Date.now() - 30 * 60 * 1000).toISOString())

      if (failedAttempts && failedAttempts.length > 2) {
        flags.push('multiple_failed_attempts')
        score += 20
        details.push(`${failedAttempts.length} failed login attempts before successful login`)
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (score >= 70) riskLevel = 'critical'
      else if (score >= 50) riskLevel = 'high'
      else if (score >= 30) riskLevel = 'medium'

      // Send alert if high or critical risk
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.sendAnomalyAlert(userId, email, {
          score,
          riskLevel,
          flags,
          details,
          loginData,
        })
      }

      return { score, riskLevel, flags, details }
    } catch (error) {
      console.error('[v0] Anomaly detection error:', error)
      return { score, riskLevel: 'low', flags, details }
    }
  }

  /**
   * Check for impossible travel between two locations
   */
  private static isImpossibleTravel(
    lastLocation: any,
    currentLocation: any,
    lastTime: string,
    currentTime: string
  ): boolean {
    if (!lastLocation) return false

    const R = 6371 // Earth radius in km
    const dLat = ((currentLocation.latitude - lastLocation.latitude) * Math.PI) / 180
    const dLon = ((currentLocation.longitude - lastLocation.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lastLocation.latitude * Math.PI) / 180) *
        Math.cos((currentLocation.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    // Calculate time difference in hours
    const timeDiff = (new Date(currentTime).getTime() - new Date(lastTime).getTime()) / (1000 * 60 * 60)

    // Maximum reasonable travel: 900 km/hour (jet speed)
    const maxKmPerHour = 900
    const maxDistance = maxKmPerHour * timeDiff

    return distance > maxDistance && timeDiff > 0.5 // At least 30 minutes for travel
  }

  /**
   * Check if IP is likely VPN/Proxy
   */
  private static isLikelyVPN(ip: string): boolean {
    // Simple heuristics - in production, use IP intelligence API
    const vpnIndicators = [
      /datacenter/i,
      /hosting/i,
      /vps/i,
      /colocation/i,
    ]

    // Check against common VPN provider patterns
    const commonVPNs = [
      /expressvpn/i,
      /nordvpn/i,
      /surfshark/i,
      /protonvpn/i,
      /ivpn/i,
    ]

    return false // Would need IP lookup service
  }

  /**
   * Check if IP is known malicious
   */
  private static isKnownMaliciousIP(ip: string): boolean {
    // In production, check against threat intelligence databases
    // like AbuseIPDB, Shodan, etc.
    return false
  }

  /**
   * Send anomaly alert via Resend
   */
  private static async sendAnomalyAlert(
    userId: string,
    email: string,
    anomalyData: {
      score: number
      riskLevel: string
      flags: string[]
      details: string[]
      loginData: any
    }
  ): Promise<void> {
    try {
      const { riskLevel, score, flags, details, loginData } = anomalyData
      const backgroundColor = riskLevel === 'critical' ? '#DC2626' : '#EA580C'

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${backgroundColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">
              ${riskLevel === 'critical' ? '🚨 Critical Security Alert' : '⚠️ Suspicious Activity Detected'}
            </h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>We detected unusual activity on your login attempt.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${backgroundColor};">
              <h3 style="margin-top: 0;">Risk Assessment</h3>
              <p><strong>Risk Score:</strong> ${score}/100</p>
              <p><strong>Risk Level:</strong> <strong style="color: ${backgroundColor};">${riskLevel.toUpperCase()}</strong></p>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Detected Anomalies</h3>
              <ul style="margin: 0; padding-left: 20px;">
                ${flags.map((flag, index) => `<li>${details[index]}</li>`).join('')}
              </ul>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Login Details</h3>
              <p><strong>Location:</strong> ${loginData.location.city}, ${loginData.location.country}</p>
              <p><strong>IP Address:</strong> ${loginData.ip}</p>
              <p><strong>Device:</strong> ${loginData.deviceName}</p>
              <p><strong>Time:</strong> ${new Date(loginData.timestamp).toLocaleString()}</p>
            </div>

            ${riskLevel === 'critical' ? `
              <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
                <p><strong>⚠️ Action Required:</strong> Your account may be under attack. Please verify this login was authorized immediately.</p>
              </div>
            ` : ''}

            <p style="margin-top: 20px; text-align: center;">
              <a href="https://yourapp.com/security/verify-device" style="background: ${backgroundColor}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                ${riskLevel === 'critical' ? 'Verify Account Now' : 'Review Activity'}
              </a>
            </p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>This is an automated security alert. Please do not share this email.</p>
          </div>
        </div>
      `

      await resend.emails.send({
        from: 'security@resend.dev',
        to: email,
        subject: `${riskLevel === 'critical' ? '🚨 ' : '⚠️ '}Suspicious Login Detected (Score: ${score}/100)`,
        html,
        replyTo: 'security@yourdomain.com',
      })

      console.log('[v0] Anomaly alert sent:', { userId, riskLevel, score })
    } catch (error) {
      console.error('[v0] Failed to send anomaly alert:', error)
    }
  }
}
