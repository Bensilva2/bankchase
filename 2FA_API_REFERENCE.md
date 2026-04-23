# 2FA System - API Reference & Troubleshooting

## API Endpoints Reference

### Profile Management

#### Get User Profile
```
GET /api/auth/profile?email=user@example.com
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profilePicture": "data:image/png;base64,...",
  "twoFactorEnabled": true,
  "totpBackupCodes": [],
  "totpSecret": "JBSWY3DPEBLW64TMMQ======",
  "deviceId": "device_1234567890",
  "lastSyncedAt": "2024-02-05T10:30:00Z",
  "updatedAt": "2024-02-05T10:30:00Z"
}
```

#### Update User Profile
```
PUT /api/auth/profile
Content-Type: application/json

{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profilePicture": "data:image/png;base64,...",
  "twoFactorEnabled": true,
  "updatedAt": "2024-02-05T10:30:00Z"
}
```

**Response (200 OK):** Returns updated profile object

---

### 2FA Setup & Management

#### Generate TOTP Setup
```
POST /api/auth/2fa/setup
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "generate"
}
```

**Response (200 OK):**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": [
    "code-1234-5678",
    "code-2345-6789",
    ...
  ]
}
```

#### Enable 2FA
```
POST /api/auth/2fa/setup
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "enable",
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "backupCodes": ["code-1234-5678", ...]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "backupCodes": [...]
}
```

#### Disable 2FA
```
POST /api/auth/2fa/setup
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "disable"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

### TOTP Verification

#### Verify TOTP Code
```
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "action": "verify-login"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "session": "session-token"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid or expired code",
  "attemptsRemaining": 2
}
```

#### Verify Backup Code
```
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "code-1234-5678",
  "action": "verify-backup"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Backup code verified successfully",
  "codesRemaining": 9
}
```

---

### Settings Management

#### Update Authentication Settings
```
POST /api/auth/settings
Content-Type: application/json

{
  "email": "user@example.com",
  "setting": "loginAlerts",
  "value": true
}
```

**Supported Settings:**
- `loginAlerts` (boolean)
- `sessionTimeout` (number: 15-480 minutes)
- `biometricEnabled` (boolean)
- `twoFactorEnabled` (boolean)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

### 2FA Synchronization

#### Check Cross-Device Sync Status
```
GET /api/auth/2fa/sync?email=user@example.com
```

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "twoFactorEnabled": true,
  "lastSync": "2024-02-05T10:30:00Z",
  "devices": [
    {
      "deviceId": "device_1234",
      "name": "Chrome on MacBook",
      "lastActive": "2024-02-05T10:30:00Z",
      "twoFactorEnabled": true
    }
  ]
}
```

#### Sync Settings
```
POST /api/auth/2fa/sync
Content-Type: application/json

{
  "email": "user@example.com",
  "deviceId": "device_1234",
  "timestamp": "2024-02-05T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "profile": { ... },
  "settings": { ... },
  "devices": [...]
}
```

---

### Device Management

#### Get Active Devices
```
GET /api/auth/devices?email=user@example.com
```

**Response (200 OK):**
```json
{
  "devices": [
    {
      "id": "uuid",
      "deviceId": "device_1234",
      "deviceName": "Chrome on MacBook",
      "deviceType": "desktop",
      "osName": "macOS",
      "browserName": "Chrome",
      "ipAddress": "192.168.1.1",
      "lastActive": "2024-02-05T10:30:00Z",
      "createdAt": "2024-02-01T08:00:00Z"
    }
  ]
}
```

#### Logout Device
```
POST /api/auth/devices
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "logout",
  "deviceId": "device_1234"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Device logged out successfully"
}
```

#### Logout All Devices
```
POST /api/auth/devices
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "logout-all"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All devices logged out successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials or expired session"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "User profile not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## React Hook Reference

### use2FA Hook

```typescript
import { use2FA } from '@/hooks/use-2fa'

const { 
  profile,           // Current user profile
  settings,          // User settings
  toggle2FA,         // Function to toggle 2FA
  updateSetting,     // Function to update setting
  isLoading,         // Loading state
  error              // Error state
} = use2FA()
```

**Profile Object:**
```typescript
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  profilePicture: string | null
  twoFactorEnabled: boolean
  totpBackupCodes: string[]
  totpSecret: string | null
  createdAt: string
  updatedAt: string
  deviceId: string
  lastSyncedAt: string
}
```

**Settings Object:**
```typescript
interface ProfileSettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  biometricEnabled: boolean
  sessionTimeout: number
  profilePicture: string | null
  totpBackupCodesCount: number
  lastTwoFactorChange: string | null
}
```

---

## Service Functions Reference

### Profile Service

```typescript
import { 
  getUserProfile,
  updateUserProfile,
  getProfileSettings,
  updateProfileSettings,
  initializeProfile,
  getDeviceId,
  onProfileChange,
  setProfilePicture,
  getProfilePicture
} from '@/lib/auth/profile-service'

// Get current profile
const profile = getUserProfile()

// Update profile
const updated = await updateUserProfile({ 
  firstName: 'John',
  twoFactorEnabled: true 
})

// Initialize on login
const newProfile = await initializeProfile('user@example.com')

// Subscribe to changes
const unsubscribe = onProfileChange((profile) => {
  console.log('Profile changed:', profile)
})

// Upload picture
const base64 = await setProfilePicture(file)
```

### TOTP Service

```typescript
import { 
  generateTOTPCode,
  verifyTOTPCode,
  generateSecret,
  generateBackupCodes,
  generateQRCode
} from '@/lib/auth/totp-service'

// Generate TOTP code
const code = generateTOTPCode(secret)

// Verify TOTP code
const isValid = verifyTOTPCode(code, secret)

// Generate new secret
const { secret, qrCode } = await generateSecret('user@example.com')

// Generate backup codes
const codes = generateBackupCodes()

// Generate QR code
const qrCode = await generateQRCode(secret, 'user@example.com')
```

### Real-time Sync Service

```typescript
import { 
  getSyncService,
  on2FASync
} from '@/lib/auth/realtime-sync-service'

// Get sync service for user
const syncService = getSyncService('user@example.com')
syncService.start()

// Listen for sync updates
syncService.onSync((data) => {
  console.log('Synced:', data)
})

// Stop service
syncService.stop()

// Listen for cross-tab events
on2FASync((event) => {
  console.log('2FA sync event:', event.detail)
})
```

---

## Troubleshooting Guide

### Issue: 2FA toggle not updating

**Symptoms:**
- Click toggle, nothing happens
- Page refreshes on toggle
- 2FA status doesn't change

**Solutions:**
1. Check browser console for errors
2. Verify Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` set
3. Check network tab - API should return 200 OK
4. Clear browser cache and reload
5. Check localStorage is enabled in browser
6. Verify user profile exists in database

**Debug:**
```typescript
// Check if profile loaded
const profile = getUserProfile()
console.log('[v0] Current profile:', profile)

// Check if settings working
const settings = getProfileSettings()
console.log('[v0] Current settings:', settings)
```

---

### Issue: Profile picture not persisting

**Symptoms:**
- Upload picture, then refresh page
- Picture disappears
- Picture doesn't sync to other devices

**Solutions:**
1. Check image size (<5MB required)
2. Verify image type (JPG, PNG, GIF)
3. Check localStorage has available space
4. Clear browser cache
5. Check database profile_picture column exists
6. Verify API /api/auth/profile endpoint working

**Debug:**
```typescript
// Check localStorage
const stored = localStorage.getItem('user_profile_picture')
console.log('[v0] Stored picture:', stored ? 'Present' : 'Missing')

// Check profile in state
const profile = getUserProfile()
console.log('[v0] Profile picture:', profile?.profilePicture ? 'Present' : 'Missing')
```

---

### Issue: Cross-tab sync not working

**Symptoms:**
- Change setting in Tab 1
- Tab 2 doesn't update
- Manual refresh needed to see changes

**Solutions:**
1. Verify storage events enabled: Check DevTools → Application → Storage
2. Check both tabs have same origin (protocol, domain, port)
3. Verify localStorage is enabled in browser
4. Check browser privacy/incognito mode (may block storage)
5. Try different browser if issue persists
6. Check for localStorage quota exceeded

**Debug:**
```typescript
// Test storage events
window.addEventListener('storage', (e) => {
  console.log('[v0] Storage event:', e.key, e.newValue)
})

// Manually trigger update
window.dispatchEvent(new StorageEvent('storage', {
  key: 'user_profile',
  newValue: JSON.stringify(profile),
  storageArea: localStorage
}))
```

---

### Issue: 2FA codes not verifying

**Symptoms:**
- Enter TOTP code from authenticator
- "Invalid code" error
- All codes rejected

**Solutions:**
1. Check time synchronization on device
2. Try waiting for next 30-second window
3. Verify secret in database is correct
4. Check code is 6 digits
5. Try backup code instead
6. Regenerate secret and re-setup

**Debug:**
```typescript
// Check TOTP generation
const code = generateTOTPCode(secret)
console.log('[v0] Generated TOTP code:', code)

// Verify manually
const isValid = verifyTOTPCode(code, secret)
console.log('[v0] Code is valid:', isValid)
```

---

### Issue: Backup codes not generating

**Symptoms:**
- Enable 2FA but no backup codes appear
- Backup codes empty array
- Can't use backup codes for recovery

**Solutions:**
1. Try disabling and re-enabling 2FA
2. Check if backup codes were already used
3. Verify database totp_backup_codes column
4. Check API response in Network tab
5. Look for error messages in console
6. Verify user_id in users table

**Debug:**
```typescript
// Check backup codes in profile
const profile = getUserProfile()
console.log('[v0] Backup codes:', profile?.totpBackupCodes)

// Check count in settings
const settings = getProfileSettings()
console.log('[v0] Backup codes count:', settings?.totpBackupCodesCount)
```

---

### Issue: Device not tracking

**Symptoms:**
- Device list empty
- No devices showing in dashboard
- Device logout not working

**Solutions:**
1. Verify user_devices table exists
2. Check device_id being generated
3. Ensure API /api/auth/devices working
4. Check database RLS policies
5. Verify user has correct permissions
6. Look for database constraint errors

**Debug:**
```typescript
// Check device ID
const deviceId = getDeviceId()
console.log('[v0] Device ID:', deviceId)

// Manually call devices API
const response = await fetch(`/api/auth/devices?email=${email}`)
const data = await response.json()
console.log('[v0] Devices response:', data)
```

---

### Issue: localStorage quota exceeded

**Symptoms:**
- Profile picture upload fails
- "QuotaExceededError" in console
- Settings not persisting

**Solutions:**
1. Clear browser cache and cookies
2. Delete old/unused data from localStorage
3. Use smaller profile pictures (<1MB)
4. Enable private browsing mode (more quota)
5. Check browser storage settings
6. Use incognito mode as workaround

**Debug:**
```typescript
// Check localStorage usage
let total = 0
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length
  }
}
console.log('[v0] localStorage usage:', Math.round(total / 1024), 'KB')

// Try clearing old data
localStorage.removeItem('old_key')
```

---

## Performance Tips

1. **Profile Pictures**: Keep under 500KB for best performance
2. **Backup Codes**: Shown once, then stored in database only
3. **Device List**: Synced every 5-10 seconds, cache locally
4. **TOTP Codes**: Generated locally every 30 seconds, no API call
5. **Settings Updates**: Batched if multiple updates within 100ms

---

## Security Best Practices

1. ✅ Never log TOTP secrets to console in production
2. ✅ Always hash backup codes before storage
3. ✅ Validate all user input on server and client
4. ✅ Use HTTPS for all API communication
5. ✅ Implement rate limiting on verification endpoints
6. ✅ Monitor audit logs for suspicious activity
7. ✅ Regularly rotate TOTP secrets
8. ✅ Require 2FA for administrative accounts

---

## Getting Help

1. Check browser console for error messages
2. Enable debug logging: `console.log('[v0] ...')`
3. Review API responses in Network tab
4. Check Supabase logs and RLS policies
5. Refer to component source code comments
6. Review `/docs/2FA_INTEGRATION_GUIDE.md`
