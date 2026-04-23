/**
 * 2FA Notification Service
 * Handles all 2FA-related email, SMS, and push notifications
 */

export interface TwoFactorNotification {
  type:
    | '2fa_enabled'
    | '2fa_disabled'
    | '2fa_code_request'
    | 'backup_code_used'
    | 'new_device'
    | 'suspicious_login'
    | 'recovery_used'
  email: string
  data: {
    [key: string]: any
  }
  urgent?: boolean
}

export class TwoFactorNotificationService {
  /**
   * Send 2FA enabled notification
   */
  static async sendTwoFactorEnabled(
    email: string,
    deviceInfo: {
      name: string
      os: string
      browser: string
    },
    timestamp: string
  ): Promise<boolean> {
    return this.sendNotification({
      type: '2fa_enabled',
      email,
      data: {
        deviceName: deviceInfo.name,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        timestamp,
        actionUrl: '/settings/security',
      },
    })
  }

  /**
   * Send 2FA disabled notification
   */
  static async sendTwoFactorDisabled(
    email: string,
    deviceInfo: {
      name: string
      os: string
      browser: string
    },
    timestamp: string,
    requiresConfirmation: boolean = true
  ): Promise<boolean> {
    return this.sendNotification({
      type: '2fa_disabled',
      email,
      urgent: true,
      data: {
        deviceName: deviceInfo.name,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        timestamp,
        requiresConfirmation,
        actionUrl: '/settings/security',
      },
    })
  }

  /**
   * Send 2FA code request notification
   */
  static async send2FACodeRequest(
    email: string,
    deviceInfo: {
      name: string
      os: string
      browser: string
      ip: string
      location: string
    },
    timestamp: string,
    isSuspicious: boolean = false
  ): Promise<boolean> {
    return this.sendNotification({
      type: '2fa_code_request',
      email,
      urgent: isSuspicious,
      data: {
        deviceName: deviceInfo.name,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ip: deviceInfo.ip,
        location: deviceInfo.location,
        timestamp,
        isSuspicious,
        actionUrl: isSuspicious ? '/security/verify' : undefined,
      },
    })
  }

  /**
   * Send backup code used notification
   */
  static async sendBackupCodeUsed(
    email: string,
    codesRemaining: number,
    timestamp: string
  ): Promise<boolean> {
    const urgent = codesRemaining <= 3

    return this.sendNotification({
      type: 'backup_code_used',
      email,
      urgent,
      data: {
        codesRemaining,
        timestamp,
        actionUrl: codesRemaining === 0 ? '/settings/2fa/regenerate' : undefined,
      },
    })
  }

  /**
   * Send new device notification
   */
  static async sendNewDeviceAlert(
    email: string,
    deviceInfo: {
      name: string
      os: string
      browser: string
      ip: string
      location: string
    },
    timestamp: string,
    requiresApproval: boolean = true
  ): Promise<boolean> {
    return this.sendNotification({
      type: 'new_device',
      email,
      urgent: true,
      data: {
        deviceName: deviceInfo.name,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        ip: deviceInfo.ip,
        location: deviceInfo.location,
        timestamp,
        requiresApproval,
        actionUrl: '/settings/security/devices',
      },
    })
  }

  /**
   * Send suspicious login alert
   */
  static async sendSuspiciousLoginAlert(
    email: string,
    flags: string[],
    deviceInfo: {
      name: string
      ip: string
      location: string
    },
    timestamp: string
  ): Promise<boolean> {
    return this.sendNotification({
      type: 'suspicious_login',
      email,
      urgent: true,
      data: {
        flags,
        deviceName: deviceInfo.name,
        ip: deviceInfo.ip,
        location: deviceInfo.location,
        timestamp,
        actionUrl: '/security/verify-device',
      },
    })
  }

  /**
   * Send recovery code used notification
   */
  static async sendRecoveryCodeUsed(
    email: string,
    recoveryMethod: 'email' | 'phone' | 'backup_code',
    timestamp: string
  ): Promise<boolean> {
    return this.sendNotification({
      type: 'recovery_used',
      email,
      urgent: true,
      data: {
        recoveryMethod,
        timestamp,
        actionUrl: '/settings/security/recovery',
      },
    })
  }

  /**
   * Send notification through multiple channels
   */
  private static async sendNotification(notification: TwoFactorNotification): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(notification)

      // Send email
      const emailResponse = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notification.email,
          subject: template.subject,
          template: 'security-2fa',
          data: {
            ...notification.data,
            type: notification.type,
            urgent: notification.urgent,
            title: template.subject,
            content: template.content,
            action: template.action,
          },
        }),
      })

      if (!emailResponse.ok) {
        console.error('[v0] Failed to send 2FA notification email')
        return false
      }

      console.log('[v0] 2FA notification sent:', {
        type: notification.type,
        email: notification.email,
      })

      return true
    } catch (error) {
      console.error('[v0] 2FA notification error:', error)
      return false
    }
  }

  /**
   * Get email template for notification type
   */
  private static getEmailTemplate(notification: TwoFactorNotification) {
    const templates: {
      [key: string]: { subject: string; content: string; action: string }
    } = {
      '2fa_enabled': {
        subject: 'Two-Factor Authentication Enabled',
        content:
          'Your account now has two-factor authentication enabled. This adds an extra layer of security to your account.',
        action: 'View Security Settings',
      },
      '2fa_disabled': {
        subject: '⚠️ Two-Factor Authentication Disabled',
        content:
          'Two-factor authentication has been disabled on your account. Your account is now less secure. If you did not make this change, please re-enable 2FA immediately.',
        action: 'Re-enable 2FA',
      },
      '2fa_code_request': {
        subject: 'Two-Factor Code Request',
        content: 'Someone requested a two-factor authentication code for your account login.',
        action: 'Verify This Was You',
      },
      'backup_code_used': {
        subject: 'Backup Code Used',
        content:
          'A backup code from your account was used to verify a login. You have limited backup codes remaining.',
        action: 'Generate New Codes',
      },
      'new_device': {
        subject: '⚠️ New Device Detected',
        content: 'A new device has logged into your account for the first time.',
        action: 'Review Devices',
      },
      'suspicious_login': {
        subject: '🚨 Suspicious Login Activity Detected',
        content:
          'We detected unusual activity when someone tried to log into your account. Please review the details and verify it was you.',
        action: 'Verify Device',
      },
      'recovery_used': {
        subject: 'Recovery Method Used',
        content:
          'A recovery method was used to access your account. Please review your security settings.',
        action: 'Review Security',
      },
    }

    return (
      templates[notification.type] || {
        subject: 'Security Notification',
        content: 'Your account has a security notification',
        action: 'View Settings',
      }
    )
  }
}
