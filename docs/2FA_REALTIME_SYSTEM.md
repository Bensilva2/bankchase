# Two-Factor Authentication (2FA) - Real-time System Documentation

## Overview

This document describes the comprehensive Two-Factor Authentication system with real-time persistence, profile picture support, and cross-device synchronization.

## Features

### ✅ TOTP (Time-based One-Time Password) Support
- Compatible with Google Authenticator, Microsoft Authenticator, Authy, FreeOTP
- 6-digit codes with 30-second expiry window
- Time window tolerance (±1 window for ~60-second acceptance)
- QR code generation for easy setup

### ✅ Backup Codes
- 10 auto-generated backup codes per user
- One-time use only
- SHA256 hashing for secure storage
- Display and copy functionality

### ✅ Real-time 2FA Toggle
- Enable/disable 2FA with instant UI update
- Automatic localStorage synchronization
- Cross-device sync via storage events
- Database sync in background

### ✅ Profile Picture Management
- Upload and store profile pictures (Base64 encoded)
- Cross-device persistence via localStorage
- 5MB file size limit
- Support for JPG, PNG, GIF formats

### ✅ Cross-Device Synchronization
- localStorage-based state management
- Storage event listeners for tab/window sync
- Device tracking with real-time status
- Automatic sync to Supabase database

## Architecture

### Components

#### 1. **Profile Service** (`lib/auth/profile-service.ts`)
Core service for user profile and settings management:
- `getUserProfile()` - Get current profile from localStorage
- `updateUserProfile()` - Update profile with localStorage + DB sync
- `setProfilePicture()` - Handle profile picture uploads
- `getProfileSettings()` - Get user settings
- `updateProfileSettings()` - Update settings with real-time sync
- `onProfileChange()` - Subscribe to profile changes (cross-tab)
- `initializeProfile()` - Initialize profile on login

#### 2. **2FA Hook** (`hooks/use-2fa.ts`)
React hook for 2FA management:
```typescript
const {
  profile,           // Current user profile
  settings,          // User settings
  isLoading,         // Loading state
  error,             // Error state
  enable2FA,         // Enable 2FA function
  disable2FA,        // Disable 2FA function
  toggle2FA,         // Toggle 2FA state
  updateSetting,     // Update specific setting
  refreshProfile,    // Refresh from database
  initialize,        // Initialize profile for email
} = use2FA()
```

#### 3. **API Routes**

##### Profile API (`app/api/auth/profile/route.ts`)
- `GET /api/auth/profile?email=user@example.com` - Get user profile
- `PUT /api/auth/profile` - Update user profile

##### 2FA Setup API (`app/api/auth/2fa/setup/route.ts`)
- `POST /api/auth/2fa/setup` with actions:
  - `generate` - Generate TOTP setup (secret, QR code, backup codes)
  - `enable` - Enable 2FA with secret and backup codes
  - `disable` - Disable 2FA

##### 2FA Verify API (`app/api/auth/2fa/verify/route.ts`)
- `POST /api/auth/2fa/verify` with actions:
  - `verify-setup` - Verify code during setup
  - `verify-login` - Verify TOTP code during login
  - `verify-backup` - Verify backup code

##### Settings API (`app/api/auth/settings/route.ts`)
- `POST /api/auth/settings` - Update auth settings (loginAlerts, sessionTimeout, etc.)

### Database Schema

```sql
-- Users table additions
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_backup_codes TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT; -- Base64 encoded
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_alerts_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_timeout INTEGER DEFAULT 30;
ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

## Usage Examples

### Enable 2FA for User

```typescript
import { use2FA } from '@/hooks/use-2fa'

export function MyComponent() {
  const { enable2FA, profile, isLoading } = use2FA()

  const handleEnable = async () => {
    try {
      await enable2FA()
      // 2FA is now enabled
    } catch (error) {
      console.error('Failed to enable 2FA:', error)
    }
  }

  return (
    <button onClick={handleEnable} disabled={isLoading}>
      Enable 2FA
    </button>
  )
}
```

### Upload Profile Picture

```typescript
import { setProfilePicture } from '@/lib/auth/profile-service'

async function handleProfilePictureUpload(file: File) {
  try {
    const base64 = await setProfilePicture(file)
    console.log('Picture uploaded:', base64)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### Listen for Profile Changes (Cross-Tab)

```typescript
import { onProfileChange } from '@/lib/auth/profile-service'

useEffect(() => {
  const unsubscribe = onProfileChange((profile) => {
    console.log('Profile updated in another tab:', profile)
    // Update UI accordingly
  })

  return unsubscribe
}, [])
```

### Initialize Profile on Login

```typescript
import { initializeProfile } from '@/lib/auth/profile-service'

async function handleLogin(email: string) {
  try {
    const profile = await initializeProfile(email)
    console.log('Profile initialized:', profile)
  } catch (error) {
    console.error('Failed to initialize:', error)
  }
}
```

## Real-time Synchronization Flow

### Single Device Flow
1. User enables 2FA in UI
2. State updates immediately in React component
3. localStorage updated with new state
4. API call sent to update database (background)
5. Storage event emitted for other components

### Cross-Device Flow
1. Device A: User enables 2FA
2. localStorage + DB updated on Device A
3. Device B (same browser, same localStorage):
   - Storage event detected
   - Profile state updated
   - UI re-renders with new state
4. Device C (different browser):
   - Next sync cycle (5-second interval via RealtimeTwoFAStatus)
   - Fetches updated profile from database
   - Updates localStorage

### Synchronization Points
- **Immediate**: React state update + localStorage
- **Near-immediate**: Storage events (same origin, different tabs)
- **Periodic**: 5-second sync check via component
- **On-demand**: `refreshProfile()` function

## Components

### AuthenticationSettings Component
Main settings interface with:
- Profile picture upload with preview
- Real-time 2FA toggle switch
- Backup codes display
- Enable/disable functionality
- Password management
- Session timeout settings
- Login alerts configuration
- Logout all devices

```typescript
import { AuthenticationSettings } from '@/components/authentication-settings'

export default function Page() {
  return <AuthenticationSettings />
}
```

### RealtimeTwoFAStatus Component
Shows:
- 2FA status (enabled/disabled)
- Active devices list
- Last sync time
- Real-time sync indicator

```typescript
import { RealtimeTwoFAStatus } from '@/components/realtime-2fa-status'

export default function SecurityPage() {
  return <RealtimeTwoFAStatus />
}
```

## Security Considerations

### ✅ Implemented
- TOTP secret stored securely in database
- Backup codes SHA256-hashed before storage
- Time window validation (±1 window)
- One-time backup code use
- Base64 encoding for profile pictures
- localStorage + server-side validation

### ⚠️ Recommendations for Production
- Implement database backup code tracking (mark as used)
- Add rate limiting to 2FA verification attempts
- Implement IP-based device tracking
- Add audit logging for 2FA changes
- Use Redis/Upstash for session management
- Implement email notifications on 2FA changes
- Add recovery email verification
- Consider hardware security key support (FIDO2)

## Testing

### Manual Testing Checklist
- [ ] Enable 2FA with authenticator app (scan QR code)
- [ ] Verify code entry during setup
- [ ] Save and view backup codes
- [ ] Use backup code for login
- [ ] Disable 2FA (requires confirmation)
- [ ] Upload profile picture
- [ ] Check profile picture persists across sessions
- [ ] Open same account in two tabs
- [ ] Enable 2FA in tab A
- [ ] Verify tab B updates automatically
- [ ] Open account in different browser
- [ ] Verify 2FA status loads correctly
- [ ] Test with expired TOTP codes
- [ ] Test with invalid codes (max 3 attempts)

## Database Migration

Run the migration script to add all necessary columns:

```sql
-- From scripts/add-2fa-columns.sql
psql -U postgres -d your_database -f scripts/add-2fa-columns.sql
```

Or in Supabase SQL editor, copy and run the contents of `scripts/add-2fa-columns.sql`.

## Troubleshooting

### Issue: 2FA not persisting across devices
**Solution**: Ensure Supabase is properly configured and API routes are returning success responses.

### Issue: Profile picture not loading
**Solution**: Check browser console for CORS errors, verify base64 encoding is valid.

### Issue: TOTP codes not validating
**Solution**: Check device time is synchronized (NTP). TOTP requires accurate time.

### Issue: Backup codes not working
**Solution**: Verify backup code format (should be XXXX-XXXX), check for spaces.

## File Structure

```
lib/auth/
├── totp-service.ts              # TOTP code generation/verification
├── profile-service.ts           # Profile and settings management
└── password-utils.ts            # Password hashing utilities

hooks/
└── use-2fa.ts                  # 2FA React hook

components/
├── authentication-settings.tsx  # Main settings interface
├── two-factor-setup.tsx        # 2FA setup wizard
├── login-2fa-verify.tsx        # Login 2FA verification
├── realtime-2fa-status.tsx     # Real-time status display
└── 2fa-status-card.tsx         # Status card component

app/api/auth/
├── profile/route.ts            # Profile API
├── 2fa/
│   ├── setup/route.ts          # 2FA setup endpoint
│   ├── verify/route.ts         # 2FA verification endpoint
│   └── login-verify/route.ts   # Login 2FA verification
└── settings/route.ts           # Settings management

scripts/
└── add-2fa-columns.sql         # Database migration
```

## Version History

- **v1.0** (Current)
  - TOTP 2FA with authenticator app support
  - Backup codes
  - Real-time localStorage sync
  - Cross-device synchronization
  - Profile picture management
  - Real-time status component

## Support

For issues or questions, check the debug logs:
```typescript
console.log("[v0] 2FA action:", action)
```

All 2FA-related logs are prefixed with `[v0]` for easy filtering.
