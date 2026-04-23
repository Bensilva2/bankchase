/**
 * IP Tracking and Geolocation Service
 * Tracks user IP addresses, locations, and detects suspicious access patterns
 */

import { createClient } from '@supabase/supabase-js'

export interface IPLocationData {
  ip: string
  country: string
  city: string
  region: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface LoginRecord {
  id: string
  userId: string
  email: string
  ip: string
  locationData: IPLocationData
  userAgent: string
  deviceName: string
  timestamp: string
  twoFactorVerified: boolean
  loginSuccess: boolean
  suspiciousFlags: string[]
}

export class IPTrackingService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Get IP address from request
   */
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const ip = request.headers.get('x-client-ip')
    if (ip) return ip

    return request.headers.get('x-real-ip') || 'unknown'
  }

  /**
   * Get geolocation data for IP address
   * Uses free API (ipapi.co) or can be replaced with paid service
   */
  async getLocationData(ip: string): Promise<IPLocationData> {
    try {
      // Skip localhost
      if (ip === 'localhost' || ip === '127.0.0.1' || ip.startsWith('192.168')) {
        return {
          ip,
          country: 'Local',
          city: 'Local',
          region: 'Local',
          latitude: 0,
          longitude: 0,
          timezone: 'Local',
          isp: 'Local Network',
          riskLevel: 'low',
        }
      }

      // Call free geolocation API
      const response = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await response.json()

      const riskLevel = this.assessRiskLevel(data)

      return {
        ip,
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        timezone: data.timezone || 'UTC',
        isp: data.org || 'Unknown',
        riskLevel,
      }
    } catch (error) {
      console.error('[v0] Geolocation error:', error)
      return {
        ip,
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
        isp: 'Unknown',
        riskLevel: 'medium',
      }
    }
  }

  /**
   * Assess risk level based on geolocation data
   */
  private assessRiskLevel(data: any): 'low' | 'medium' | 'high' {
    // Check for VPN/Proxy
    if (data.is_vpn || data.org?.includes('VPN')) {
      return 'high'
    }

    // Check for known malicious IPs
    if (data.threat?.is_threat) {
      return 'high'
    }

    // Default to low for normal locations
    return 'low'
  }

  /**
   * Log login attempt with IP and location data
   */
  async logLoginAttempt(
    userId: string,
    email: string,
    ip: string,
    userAgent: string,
    deviceName: string,
    twoFactorVerified: boolean,
    loginSuccess: boolean
  ): Promise<LoginRecord> {
    try {
      const locationData = await this.getLocationData(ip)
      const suspiciousFlags = await this.detectSuspiciousActivity(userId, ip, locationData)

      const record: LoginRecord = {
        id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        email,
        ip,
        locationData,
        userAgent,
        deviceName,
        timestamp: new Date().toISOString(),
        twoFactorVerified,
        loginSuccess,
        suspiciousFlags,
      }

      // Save to database
      const { error } = await this.supabase.from('login_history').insert([
        {
          id: record.id,
          user_id: userId,
          email,
          ip,
          location_data: locationData,
          user_agent: userAgent,
          device_name: deviceName,
          timestamp: record.timestamp,
          two_factor_verified: twoFactorVerified,
          login_success: loginSuccess,
          suspicious_flags: suspiciousFlags,
        },
      ])

      if (error) {
        console.error('[v0] Failed to log login attempt:', error)
      }

      // Trigger alerts if suspicious
      if (suspiciousFlags.length > 0) {
        await this.triggerSecurityAlert(userId, email, record, suspiciousFlags)
      }

      return record
    } catch (error) {
      console.error('[v0] Login logging error:', error)
      throw error
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(
    userId: string,
    currentIp: string,
    currentLocation: IPLocationData
  ): Promise<string[]> {
    const flags: string[] = []

    try {
      // Get recent login history for this user
      const { data: recentLogins, error } = await this.supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10)

      if (error) {
        console.error('[v0] Failed to fetch login history:', error)
        return flags
      }

      if (recentLogins && recentLogins.length > 0) {
        const lastLogin = recentLogins[0]

        // Check for impossible travel
        if (this.isImpossibleTravel(lastLogin.location_data, currentLocation)) {
          flags.push('impossible_travel')
        }

        // Check for new country/city
        if (lastLogin.location_data?.country !== currentLocation.country) {
          flags.push('new_country')
        }

        if (lastLogin.location_data?.city !== currentLocation.city) {
          flags.push('new_city')
        }

        // Check for new device
        if (lastLogin.user_agent !== currentLocation.isp) {
          flags.push('new_device')
        }
      }

      // Check for high-risk IP
      if (currentLocation.riskLevel === 'high') {
        flags.push('high_risk_ip')
      }

      // Check for known patterns
      if (this.isKnownSuspiciousPattern(currentIp)) {
        flags.push('known_suspicious_ip')
      }
    } catch (error) {
      console.error('[v0] Suspicious activity detection error:', error)
    }

    return flags
  }

  /**
   * Check for impossible travel (traveled too fast between locations)
   */
  private isImpossibleTravel(
    lastLocation: IPLocationData,
    currentLocation: IPLocationData
  ): boolean {
    // Haversine formula to calculate distance
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

    // Maximum reasonable travel: 900 km/hour (jet speed)
    // If traveled more than 900 km in less than 1 hour, it's impossible
    const maxKmPerHour = 900
    const distanceThreshold = maxKmPerHour

    return distance > distanceThreshold
  }

  /**
   * Check if IP matches known suspicious patterns
   */
  private isKnownSuspiciousPattern(ip: string): boolean {
    // In production, this would check against a database of known malicious IPs
    // For now, simple checks
    const parts = ip.split('.')
    if (parts.length !== 4) return false

    // Check for reserved IP ranges
    const reserved = [
      [10, 0, 0, 0, 8],
      [172, 16, 0, 0, 12],
      [192, 168, 0, 0, 16],
      [127, 0, 0, 0, 8],
    ]

    return false // Placeholder
  }

  /**
   * Trigger security alert for suspicious activity
   */
  private async triggerSecurityAlert(
    userId: string,
    email: string,
    loginRecord: LoginRecord,
    suspiciousFlags: string[]
  ): Promise<void> {
    try {
      const riskLevel = suspiciousFlags.length > 2 ? 'high' : 'medium'

      // Send email notification
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          subject: `Security Alert: Unusual Login Activity Detected`,
          template: 'security-alert',
          data: {
            riskLevel,
            location: `${loginRecord.locationData.city}, ${loginRecord.locationData.country}`,
            ip: loginRecord.ip,
            device: loginRecord.deviceName,
            timestamp: new Date(loginRecord.timestamp).toLocaleString(),
            suspiciousFlags,
            actionRequired: riskLevel === 'high',
          },
        }),
      })

      // Log security event to audit trail
      await this.supabase.from('security_events').insert([
        {
          user_id: userId,
          event_type: 'suspicious_login',
          severity: riskLevel,
          description: `Suspicious login attempt from ${loginRecord.locationData.city}, ${loginRecord.locationData.country}`,
          ip_address: loginRecord.ip,
          metadata: {
            flags: suspiciousFlags,
            locationData: loginRecord.locationData,
          },
          created_at: new Date().toISOString(),
        },
      ])

      console.log('[v0] Security alert triggered:', { userId, riskLevel, flags: suspiciousFlags })
    } catch (error) {
      console.error('[v0] Security alert error:', error)
    }
  }

  /**
   * Get login history for user
   */
  async getLoginHistory(userId: string, limit = 50): Promise<LoginRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[v0] Failed to fetch login history:', error)
        return []
      }

      return (
        data?.map((record: any) => ({
          id: record.id,
          userId: record.user_id,
          email: record.email,
          ip: record.ip,
          locationData: record.location_data,
          userAgent: record.user_agent,
          deviceName: record.device_name,
          timestamp: record.timestamp,
          twoFactorVerified: record.two_factor_verified,
          loginSuccess: record.login_success,
          suspiciousFlags: record.suspicious_flags || [],
        })) || []
      )
    } catch (error) {
      console.error('[v0] Login history retrieval error:', error)
      return []
    }
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

      const { data, error } = await this.supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', oneHourAgo)
        .eq('login_success', true)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('[v0] Failed to fetch active sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[v0] Active sessions retrieval error:', error)
      return []
    }
  }
}

export function createIPTrackingService(): IPTrackingService {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return new IPTrackingService(supabaseUrl, supabaseKey)
}
