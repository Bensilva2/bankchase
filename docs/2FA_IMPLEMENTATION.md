# Two-Factor Authentication (TOTP) Implementation

## Overview

This document describes the complete TOTP (Time-based One-Time Password) 2FA implementation for the authentication system.

## Features Implemented

### 1. **TOTP Service** (`/lib/auth/totp-service.ts`)
- Generate TOTP secrets using cryptographic functions
- Generate QR codes for easy setup with authenticator apps
- Verify TOTP codes with configurable time windows
- Generate backup codes for account recovery

### 2. **Database Support** (`/scripts/add-2fa-columns.sql`)
- `totp_secret`: Encrypted storage of TOTP secret key
- `two_factor_enabled`: Flag to enable/disable 2FA
- `backup_codes`: JSON array of backup codes
- Index on `two_factor_enabled` for performance

### 3. **2FA Setup Component** (`/components/two-factor-setup.tsx`)
- QR code display for scanning with authenticator apps
- Manual secret key display for manual entry
- TOTP verification before enabling
- Backup code generation and display
- Real-time setup confirmation

### 4. **Settings Integration** (`/components/authentication-settings.tsx`)
- Enable/Disable 2FA from account settings
- View and manage backup codes
- Real-time status updates
- Smooth enable/disable workflow

### 5. **Login Integration**
- **Updated Auth Route** (`/app/api/auth/route.ts`)
  - Check for TOTP requirement after password verification
  - Verify TOTP codes during login
  - Support for backup code usage

- **Updated Secure Login** (`/components/secure-login.tsx`)
  - New TOTP verification step in login flow
  - Attempt limiting (3 attempts max)
  - Smooth transition between credential and TOTP entry
  - Error handling with remaining attempts display

### 6. **API Endpoints**

#### Setup 2FA
- **POST** `/api/auth/2fa/setup`
- Generates TOTP secret and QR code
- Enables/disables 2FA
- Returns backup codes

#### Verify 2FA Setup
- **POST** `/api/auth/2fa/verify`
- Confirms TOTP code during setup
- Stores TOTP secret if valid

#### Login Verification
- **POST** `/api/auth/2fa/login-verify`
- Verifies TOTP or backup codes during login
- Removes used backup codes from database

### 7. **User Guide Component** (`/components/two-factor-guide.tsx`)
- Step-by-step setup instructions
- Recommended authenticator apps
- Login process explanation
- Backup code management
- FAQ section
- Best practices

## Dependencies

Added to `package.json`:
- `hi-base32`: ^0.5.1 - For base32 encoding/decoding

## Setup Flow

### For Users Enabling 2FA

1. Navigate to Security Settings
2. Click "Enable TOTP 2FA"
3. Scan QR code with authenticator app
4. Enter 6-digit code to verify
5. Save backup codes securely
6. 2FA is now enabled

### For Users Logging In

**Without 2FA:**
1. Enter email & password
2. Enter OTP code
3. Login complete

**With 2FA:**
1. Enter email & password
2. Enter 6-digit code from authenticator app (or backup code)
3. Login complete

## Security Features

- ✅ Time-based verification (30-second window)
- ✅ Backup codes for account recovery
- ✅ Attempt limiting on login
- ✅ Secure TOTP secret storage
- ✅ One-time use backup codes
- ✅ Support for all standard authenticator apps

## Supported Authenticator Apps

- Google Authenticator
- Microsoft Authenticator
- Authy
- LastPass Authenticator
- FreeOTP
- Aegis
- Any RFC 4226/6238 compatible app

## Files Created/Modified

### Created
- `/lib/auth/totp-service.ts`
- `/components/two-factor-setup.tsx`
- `/components/login-2fa-verify.tsx`
- `/components/two-factor-guide.tsx`
- `/app/api/auth/2fa/setup/route.ts`
- `/app/api/auth/2fa/verify/route.ts`
- `/app/api/auth/2fa/login-verify/route.ts`
- `/scripts/add-2fa-columns.sql`
- `/docs/2FA_IMPLEMENTATION.md`

### Modified
- `/components/authentication-settings.tsx` - Added 2FA UI
- `/components/secure-login.tsx` - Added TOTP verification step
- `/app/api/auth/route.ts` - Added TOTP verification logic
- `/package.json` - Added hi-base32 dependency

## Testing

### Setup Test
1. Go to Settings → Two-Factor Authentication
2. Click "Enable TOTP 2FA"
3. Scan QR with Google Authenticator
4. Enter the generated code
5. Verify 2FA is enabled

### Login Test
1. Log out
2. Enter credentials
3. When prompted, enter TOTP code from app
4. Verify login succeeds

### Backup Code Test
1. Go to Settings → View Backup Codes
2. Copy a backup code
3. Log out
4. On TOTP screen, switch to "Use backup code"
5. Paste backup code
6. Verify backup code works and is removed

### Disable Test
1. Go to Settings
2. Click "Disable 2FA"
3. Confirm in dialog
4. Verify 2FA is disabled
5. Log in with just password + OTP

## Error Handling

- Invalid TOTP codes show remaining attempts
- Backup codes are one-time use only
- Maximum 3 failed TOTP attempts before requiring re-login
- Used backup codes are automatically removed
- Clear error messages guide users

## Future Enhancements

- SMS/Email backup 2FA method
- WebAuthn/FIDO2 support
- Trusted device functionality
- 2FA activity logging
- Device management interface
- Account recovery options

## Troubleshooting

**Code not working:**
- Verify phone time is synchronized
- Check authenticator app is updated
- Ensure correct 6-digit code entered

**Lost phone:**
- Use a backup code to log in
- Disable and re-enable 2FA
- Contact support for manual recovery

**Backup codes used up:**
- Generate new backup codes from settings
- Old codes become invalid

## Support

For issues or questions about 2FA, users should:
1. Check the guide component
2. Review the FAQ section
3. Use backup codes if available
4. Contact support if needed
