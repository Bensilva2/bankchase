# 2FA Quick Start Guide

## What's New

Your authentication system now includes full TOTP (Time-based One-Time Password) support with these capabilities:

✅ **Enable/Disable 2FA** - Toggle 2FA on and off from settings  
✅ **Real-time Authenticator Integration** - Works with any RFC 6238 compatible app  
✅ **Backup Codes** - One-time use recovery codes  
✅ **Attempt Limiting** - Security against brute force attacks  
✅ **Seamless Login** - Integrated TOTP verification during login  

## User Journey

### 1. Setup 2FA (User Actions)

```
Settings → Two-Factor Authentication → Enable TOTP 2FA
    ↓
See QR Code
    ↓
Scan with Google Authenticator (or similar)
    ↓
Enter 6-digit code to verify
    ↓
View and save backup codes
    ↓
2FA enabled ✓
```

### 2. Login with 2FA (User Actions)

```
Enter Email & Password
    ↓
System checks if 2FA enabled
    ↓
If YES: Show TOTP verification screen
    ↓
User enters code from authenticator app
    ↓
Code verified (or use backup code)
    ↓
Login complete ✓
```

### 3. Manage 2FA (User Actions)

```
Settings → Two-Factor Authentication
    ↓
View Status: "Enabled" or "Disabled"
    ↓
Option 1: View backup codes
Option 2: Disable 2FA
    ↓
Done
```

## Key Components

### For Users
- **`/components/two-factor-setup.tsx`** - Setup flow with QR code
- **`/components/authentication-settings.tsx`** - Main 2FA settings
- **`/components/secure-login.tsx`** - Login with TOTP verification
- **`/components/two-factor-guide.tsx`** - Educational guide

### For Developers
- **`/lib/auth/totp-service.ts`** - Core TOTP logic
- **`/app/api/auth/2fa/setup/route.ts`** - Setup endpoint
- **`/app/api/auth/2fa/verify/route.ts`** - Verify endpoint
- **`/app/api/auth/2fa/login-verify/route.ts`** - Login verification

## System Flow Diagram

```
┌─────────────────────────────────────┐
│   User Actions                      │
└─────────────────────────────────────┘
           │
           ├─ Enable 2FA
           │   └─→ TwoFactorSetup Component
           │        └─→ POST /api/auth/2fa/setup
           │             └─→ Generate secret + QR
           │
           ├─ Login
           │   └─→ SecureLogin Component
           │        └─→ POST /api/auth (verify password)
           │             └─→ Check 2FA enabled
           │                 └─ If YES: Show TOTP screen
           │
           ├─ Verify TOTP
           │   └─→ POST /api/auth (verify-totp)
           │        └─→ verifyTOTP() function
           │             └─ Valid → Login complete
           │             └─ Invalid → Show error
           │
           └─ Manage 2FA
               └─→ AuthenticationSettings Component
                    ├─ View status + backup codes
                    └─ Disable 2FA

┌─────────────────────────────────────┐
│   Database                          │
└─────────────────────────────────────┘
    - users.totp_secret
    - users.backup_codes
    - users.two_factor_enabled
```

## Testing Checklist

- [ ] Enable 2FA in Settings
- [ ] Scan QR code with Google Authenticator
- [ ] Verify setup with 6-digit code
- [ ] See backup codes displayed
- [ ] Save backup codes
- [ ] Log out
- [ ] Log in with email + password
- [ ] Enter TOTP code from app
- [ ] Verify login succeeds
- [ ] Log out again
- [ ] Test with backup code instead
- [ ] Log in with backup code
- [ ] Verify backup code was used
- [ ] Disable 2FA
- [ ] Log in with just password

## Error Scenarios & Handling

| Scenario | Behavior |
|----------|----------|
| Invalid TOTP code | "Invalid code (2 attempts remaining)" |
| 3 failed TOTP attempts | Redirect to login page |
| Used backup code | Removed from database, can't be used again |
| No backup codes left | Warning in settings |
| TOTP secret missing | Error: "2FA is not properly configured" |
| Clock drift | 30-second window handles up to ±30s drift |

## Security Considerations

✅ **Implemented:**
- Time-based TOTP (RFC 6238 compliant)
- 6-digit codes with 30-second validity
- Backup codes for account recovery
- Attempt limiting (3 attempts max)
- One-time use backup codes
- Secure secret storage in database

🔒 **Best Practices:**
- Users should save backup codes
- Users should keep authenticator app updated
- System checks time window flexibility
- Database stores encrypted secrets

## Supported Authenticator Apps

All RFC 6238 compatible apps work:
- ✓ Google Authenticator
- ✓ Microsoft Authenticator
- ✓ Authy
- ✓ LastPass Authenticator
- ✓ FreeOTP
- ✓ Any TOTP app

## Troubleshooting

### "QR code won't scan"
→ Use manual entry option if available
→ Ensure good lighting
→ Try different authenticator app

### "Code doesn't work"
→ Check phone time is correct
→ Ensure app is updated
→ Try code from different time window

### "Lost authenticator phone"
→ Use backup code to log in
→ Disable and re-enable 2FA
→ Contact support if backup codes exhausted

## Real-time Features

✅ **All features work smoothly in real-time:**
- Enable 2FA → Immediate dashboard update
- Disable 2FA → Immediate dashboard update
- View backup codes → Instant display
- Login with TOTP → Real-time verification
- Failed attempts → Immediate error feedback

## API Reference

### POST /api/auth/2fa/setup
```json
{
  "email": "user@example.com",
  "action": "enable" | "disable"
}

// Response with QR code and secret
{
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "backupCodes": ["XXXX-XXXX-XXXX", ...]
}
```

### POST /api/auth/2fa/verify
```json
{
  "email": "user@example.com",
  "code": "123456"
}

// Response
{
  "success": true,
  "message": "2FA verification successful"
}
```

### POST /api/auth (verify-totp)
```json
{
  "action": "verify-totp",
  "userId": "user-id",
  "otp": "123456"
}

// Response
{
  "message": "TOTP verification successful",
  "userId": "user-id",
  "authenticated": true
}
```

## Next Steps

1. Test the 2FA flow end-to-end
2. Share the guide with users
3. Monitor for any issues
4. Gather user feedback
5. Consider additional features (WebAuthn, SMS backup, etc.)

For full implementation details, see `/docs/2FA_IMPLEMENTATION.md`
