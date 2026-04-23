# Advanced 2FA Security Features Guide

## Overview

This guide covers the advanced security features added to your 2FA system, including real-time email notifications, IP tracking, geolocation, device management, and suspicious activity detection.

## Features Added

### 1. Email Notifications

**Service**: `lib/security/2fa-notification-service.ts`

Real-time email alerts for all 2FA-related activities:
- 2FA enabled/disabled
- Login attempts from new devices
- Backup codes used
- Suspicious activity detected
- Recovery codes used

**Usage**:
```typescript
import { TwoFactorNotificationService } from '@/lib/security/2fa-notification-service'

// Send 2FA enabled notification
await TwoFactorNotificationService.sendTwoFactorEnabled(
  'user@example.com',
  {
    name: 'Chrome on MacOS',
    os: 'macOS',
    browser: 'Chrome'
  },
  new Date().toISOString()
)
```

### 2. IP Tracking and Geolocation

**Service**: `lib/security/ip-tracking-service.ts`

Tracks user login locations and detects suspicious patterns:
- IP address logging
- Geographic location tracking
- ISP and network information
- Suspicious IP detection
- Impossible travel detection

**API**: Uses free `ipapi.co` service (can be upgraded to paid alternatives)

**Suspicious Activity Detection**:
- Impossible travel (>900 km/hour between logins)
- New country/city logins
- New device detection
- High-risk IP identification
- Known malicious IP patterns

**Usage**:
```typescript
import { createIPTrackingService } from '@/lib/security/ip-tracking-service'

const ipTracker = createIPTrackingService()

// Log login attempt
const loginRecord = await ipTracker.logLoginAttempt(
  userId,
  email,
  ip,
  userAgent,
  deviceName,
  twoFactorVerified,
  loginSuccess
)

// Get login history
const history = await ipTracker.getLoginHistory(userId, 50)

// Get active sessions
const sessions = await ipTracker.getActiveSessions(userId)
```

### 3. Real-Time Security Alerts Dashboard

**Component**: `components/security-alerts-dashboard.tsx`

Visual dashboard for monitoring security events:
- Active security alerts with severity levels
- Active device sessions
- Location and IP information
- Time-based activity tracking
- Alert dismissal and device logout
- Auto-refresh capability (10-second intervals)

**Features**:
- High-priority alert highlighting
- Alert details modal
- Device logout functionality
- Real-time status updates
- Color-coded severity levels

### 4. Login History Tracking

**Component**: `components/login-history.tsx`
**API**: `app/api/security/login-history/route.ts`

Comprehensive login history with:
- Timestamp and device information
- Location and IP tracking
- Operating system and browser detection
- 2FA verification status
- Suspicious activity flagging
- Expandable details view

**Filters**:
- All logins
- Suspicious logins only
- Verified 2FA logins

### 5. API Endpoints

#### Security Alerts
```
GET    /api/security/alerts?user_id=...&status=active&limit=50
PATCH  /api/security/alerts?id=...  (update alert status)
```

#### Active Sessions
```
GET    /api/security/sessions?user_id=...&active_only=true
DELETE /api/security/sessions?id=...  (logout device)
POST   /api/security/sessions  (create new session)
```

#### Login History
```
GET    /api/security/login-history?user_id=...&limit=50&suspicious=false
POST   /api/security/login-history  (log new login)
```

## Integration Guide

### 1. Add to Your Settings Page

```typescript
import { SecurityAlertsDashboard } from '@/components/security-alerts-dashboard'
import { LoginHistory } from '@/components/login-history'

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <SecurityAlertsDashboard />
      <LoginHistory />
    </div>
  )
}
```

### 2. Log Login Attempts

```typescript
import { createIPTrackingService } from '@/lib/security/ip-tracking-service'

// In your login route handler
const ipTracker = createIPTrackingService()

const record = await ipTracker.logLoginAttempt(
  userId,
  email,
  clientIP,
  userAgent,
  deviceName,
  twoFactorVerified,
  loginSuccess
)
```

### 3. Send Notifications

```typescript
import { TwoFactorNotificationService } from '@/lib/security/2fa-notification-service'

// When 2FA is enabled
await TwoFactorNotificationService.sendTwoFactorEnabled(
  userEmail,
  deviceInfo,
  timestamp
)
```

## Database Schema

### login_history Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- email: VARCHAR(255)
- ip: VARCHAR(50)
- user_agent: TEXT
- device_name: VARCHAR(255)
- location_data: JSONB
- two_factor_verified: BOOLEAN
- login_success: BOOLEAN
- suspicious_flags: TEXT[]
- timestamp: TIMESTAMP
- created_at: TIMESTAMP
```

### security_events Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- event_type: VARCHAR(50)
- severity: VARCHAR(20) ('low', 'medium', 'high')
- description: TEXT
- ip_address: VARCHAR(50)
- metadata: JSONB
- resolved: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Email Templates

Supported email notification types:
- `2fa_enabled` - 2FA activation confirmation
- `2fa_disabled` - 2FA deactivation warning
- `2fa_code_request` - Login verification code request
- `backup_code_used` - Backup code usage notification
- `new_device` - New device login alert
- `suspicious_login` - Suspicious activity alert
- `recovery_used` - Recovery method usage alert

## Suspicious Activity Flags

The system detects and flags:
- `impossible_travel` - Traveled >900 km/hour between logins
- `new_country` - Login from new country
- `new_city` - Login from new city
- `new_device` - Unknown device
- `high_risk_ip` - IP flagged as high-risk
- `known_suspicious_ip` - Known malicious IP address

## Real-Time Features

### Auto-Refresh Intervals
- Security Alerts Dashboard: 10 seconds
- Login History: 30 seconds
- Active Sessions: 15 seconds

### Storage Persistence
- localStorage for client-side state
- Supabase for persistent storage
- Real-time subscriptions for live updates

## Configuration

### IP Geolocation API

Currently using free `ipapi.co` service. For production, upgrade to:
- **MaxMind GeoIP2**: More accurate geolocation
- **IP2Location**: Comprehensive IP intelligence
- **Abstract API**: Modern IP geolocation service

```typescript
// Update in ip-tracking-service.ts
const response = await fetch(`https://ipapi.co/${ip}/json/`)
// Replace with your preferred service
```

### Email Service

Currently logs to console. In production, integrate with:
- **SendGrid**: `npm install @sendgrid/mail`
- **Mailgun**: `npm install mailgun.js`
- **AWS SES**: Uses AWS SDK
- **Brevo**: `npm install sib-api-v3-sdk`

### Notification Channels

Update `TwoFactorNotificationService` to support:
- SMS via Twilio or AWS SNS
- Push notifications via Firebase
- Slack/Discord webhooks
- In-app notifications

## Security Best Practices

1. **Enable 2FA by Default**: Encourage users to enable 2FA
2. **Monitor Suspicious Activity**: Review high-risk alerts daily
3. **Limit Session Duration**: Set appropriate session timeout
4. **Device Management**: Allow users to revoke device access
5. **Audit Logging**: Keep comprehensive audit trails
6. **Rate Limiting**: Implement login attempt rate limiting
7. **IP Whitelisting**: Optional allowlist for trusted IPs
8. **Encryption**: Use HTTPS and encrypt sensitive data

## Troubleshooting

### No Alerts Showing
- Check that security events are being logged
- Verify Supabase connection
- Check browser console for errors
- Ensure auto-refresh is enabled

### Email Not Sending
- Verify email endpoint is configured
- Check email service credentials
- Review email template configuration
- Check spam folder

### Geolocation Inaccurate
- IP geolocation APIs have limitations
- VPN/Proxy services will show proxy location
- Update to premium geolocation service

### Sessions Not Updating
- Check last_active timestamp
- Verify login_history table has records
- Ensure user_id matches
- Check for database connection issues

## Future Enhancements

- [ ] SMS notifications via Twilio
- [ ] Push notifications via Firebase
- [ ] Risk-based authentication
- [ ] Machine learning anomaly detection
- [ ] Geographic hot-spot analysis
- [ ] Device fingerprinting
- [ ] Biometric authentication
- [ ] WebAuthn/FIDO2 support
- [ ] Adaptive authentication
- [ ] Real-time threat intelligence integration

## Support

For issues or questions, refer to:
- Main 2FA documentation: `README_2FA.md`
- API reference: `2FA_API_REFERENCE.md`
- Integration guide: `docs/2FA_INTEGRATION_GUIDE.md`
