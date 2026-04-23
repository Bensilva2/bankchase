# 2FA System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          AUTHENTICATION SETTINGS PAGE                    │   │
│  │  ┌───────────────────┐      ┌────────────────────────┐  │   │
│  │  │ 2FA Status Card   │      │  2FA Setup Component   │  │   │
│  │  │ ├─ Enabled/      │      │  ├─ QR Code Display   │  │   │
│  │  │ │  Disabled       │      │  ├─ Manual Entry      │  │   │
│  │  │ ├─ Backup Codes   │      │  ├─ Code Verification│  │   │
│  │  │ │  Available      │      │  └─ Backup Codes      │  │   │
│  │  │ └─ Status Colors  │      │     Generation        │  │   │
│  │  └───────────────────┘      └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SECURE LOGIN PAGE                           │   │
│  │  ┌─────────────────┐       ┌───────────────────────┐    │   │
│  │  │ Credentials     │       │ TOTP Verification    │    │   │
│  │  │ ├─ Email        │  →    │ ├─ 6-digit input    │    │   │
│  │  │ ├─ Password     │       │ ├─ Attempt counter  │    │   │
│  │  │ └─ Submit       │       │ ├─ Backup code opt  │    │   │
│  │  │                 │       │ └─ Verify button    │    │   │
│  │  └─────────────────┘       └───────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          HELP & GUIDES                                  │   │
│  │  ├─ 2FA Setup Guide                                     │   │
│  │  ├─ FAQ Section                                         │   │
│  │  ├─ Troubleshooting                                     │   │
│  │  └─ Best Practices                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          ROUTE HANDLERS (Next.js)                       │   │
│  │                                                          │   │
│  │  POST /api/auth                                         │   │
│  │  ├─ action: 'login'         → Password verification    │   │
│  │  ├─ action: 'verify-totp'   → TOTP verification       │   │
│  │  └─ action: 'signup'        → New user creation       │   │
│  │                                                          │   │
│  │  POST /api/auth/2fa/setup                              │   │
│  │  ├─ Generate TOTP secret                              │   │
│  │  ├─ Generate QR code                                   │   │
│  │  ├─ Enable/Disable 2FA                                │   │
│  │  └─ Generate backup codes                             │   │
│  │                                                          │   │
│  │  POST /api/auth/2fa/verify                             │   │
│  │  ├─ Verify TOTP code                                   │   │
│  │  ├─ Store TOTP secret                                  │   │
│  │  └─ Save backup codes                                  │   │
│  │                                                          │   │
│  │  POST /api/auth/2fa/login-verify                       │   │
│  │  ├─ Verify TOTP or backup code                        │   │
│  │  ├─ Remove used backup code                           │   │
│  │  └─ Update session                                     │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓↑                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          SERVICE LAYER                                  │   │
│  │                                                          │   │
│  │  totp-service.ts                                       │   │
│  │  ├─ generateTOTPSecret()                               │   │
│  │  │  └─ Create cryptographically secure secret         │   │
│  │  │                                                      │   │
│  │  ├─ generateQRCode()                                   │   │
│  │  │  └─ Create QR code for scanning                    │   │
│  │  │                                                      │   │
│  │  ├─ verifyTOTP()                                       │   │
│  │  │  └─ Verify 6-digit code with time window          │   │
│  │  │                                                      │   │
│  │  └─ generateBackupCodes()                              │   │
│  │     └─ Generate 12 one-time use codes                │   │
│  │                                                          │   │
│  │  password-utils.ts                                     │   │
│  │  ├─ hashPassword()                                     │   │
│  │  └─ verifyPassword()                                   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓↑                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          DATA PERSISTENCE LAYER                         │   │
│  │                                                          │   │
│  │  Supabase (PostgreSQL)                                 │   │
│  │  └─ Database Connection                                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TABLE: users                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Column Name          │ Type      │ Purpose             │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ id                    │ UUID      │ User identifier     │    │
│  │ email                 │ TEXT      │ Email address       │    │
│  │ password_hash         │ TEXT      │ Hashed password     │    │
│  │ totp_secret           │ TEXT      │ TOTP secret key     │    │
│  │ two_factor_enabled    │ BOOLEAN   │ 2FA status          │    │
│  │ backup_codes          │ JSON      │ Recovery codes      │    │
│  │ created_at            │ TIMESTAMP │ Creation date       │    │
│  │ last_login            │ TIMESTAMP │ Last login date     │    │
│  │ updated_at            │ TIMESTAMP │ Last update         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  INDEX: idx_users_two_factor_enabled                            │
│  └─ Performance optimization for 2FA queries                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Setup 2FA Flow

```
User                 Component              API              Database
  │                    │                    │                  │
  ├─ Enable 2FA ─────→ │                    │                  │
  │                    ├─ Generate Secret ──→ │                  │
  │                    │                    ├─ Create Key ─────→ │
  │                    │                    │ ← Return Secret ┤ │
  │                    │ ← Show QR Code ────┤                  │
  │                    │                    │                  │
  ├─ Scan QR ────────→ │                    │                  │
  ├─ Enter Code ─────→ │                    │                  │
  │                    ├─ Verify Code ─────→ │                  │
  │                    │                    ├─ Check Valid ────→ │
  │                    │                    │ ← Valid? Yes ────┤ │
  │                    │ ← Verified! ───────┤                  │
  │                    │                    ├─ Store Secret ──→ │
  │                    │                    ├─ Generate Codes ─→ │
  │                    │                    │ ← Backup Codes ──┤ │
  │                    │ ← Show Backup ────→ │                  │
  ├─ Save Codes ─────→ │                    │                  │
  │                    ├─ Update Settings ──→ │                  │
  │                    │                    ├─ Enable Flag ───→ │
  │                    │ ← 2FA Enabled! ────┤                  │
  └                    └                    └                  └
```

### Login 2FA Flow

```
User                 Component              API              Database
  │                    │                    │                  │
  ├─ Email+Pwd ──────→ │                    │                  │
  │                    ├─ Verify Pwd ──────→ │                  │
  │                    │                    ├─ Check Pwd ─────→ │
  │                    │                    │ ← Valid ────────┤ │
  │                    │                    ├─ Check 2FA ─────→ │
  │                    │                    │ ← Enabled? ─────┤ │
  │                    │ ← Show TOTP ──────→ │                  │
  │                    │                    │                  │
  ├─ Enter TOTP Code ─→ │                    │                  │
  │                    ├─ Verify TOTP ─────→ │                  │
  │                    │                    ├─ Check Secret ──→ │
  │                    │                    │ ← Verify Code ──┤ │
  │                    │                    │ ← Valid? Yes ───┤ │
  │                    │ ← Login Success ───┤                  │
  │                    │                    ├─ Update Login ──→ │
  │                    │ ← Redirect Home ──→ │                  │
  └                    └                    └                  └
```

### Backup Code Recovery Flow

```
User                 Component              API              Database
  │                    │                    │                  │
  ├─ Email+Pwd ──────→ │                    │                  │
  │                    ├─ Verify Pwd ──────→ │                  │
  │                    │ ← Show TOTP ──────→ │                  │
  │                    │                    │                  │
  ├─ Use Backup Code ─→ │                    │                  │
  │                    │ ← Switch Mode ────→ │                  │
  │                    │                    │                  │
  ├─ Enter Code ─────→ │                    │                  │
  │                    ├─ Verify Code ─────→ │                  │
  │                    │                    ├─ Check Backup ──→ │
  │                    │                    │ ← Valid? Yes ───┤ │
  │                    │ ← Login Success ───┤                  │
  │                    │                    ├─ Remove Code ───→ │
  │                    │                    ├─ Update Login ──→ │
  │                    │ ← Redirect Home ──→ │                  │
  └                    └                    └                  └
```

---

## Component Dependencies

```
two-factor-guide.tsx
├─ (Standalone - Educational)

authentication-settings.tsx
├─ two-factor-setup.tsx (Modal)
│  └─ totp-service.ts
├─ 2fa-status-card.tsx
└─ API: /api/auth/2fa/setup
   └─ API: /api/auth/2fa/verify

secure-login.tsx
├─ login-2fa-verify.tsx (TOTP verification)
│  └─ API: /api/auth/2fa/login-verify
├─ API: /api/auth (password check)
│  └─ totp-service.ts
└─ Redirect based on TOTP result

totp-service.ts
├─ generateTOTPSecret()
├─ generateQRCode()
├─ verifyTOTP()
└─ generateBackupCodes()
```

---

## Authentication Sequence

### Complete Login Flow with 2FA

```
1. User enters email + password
   └─ Component: secure-login.tsx
   
2. Submit to /api/auth (login action)
   ├─ Validate email exists
   ├─ Verify password hash
   ├─ Check if 2FA enabled
   └─ Return response
   
3a. If 2FA enabled:
    ├─ Return: { requiresTOTP: true, userId }
    ├─ Component shows TOTP screen
    ├─ User enters 6-digit code
    └─ Submit to /api/auth (verify-totp)
    
3b. If 2FA disabled:
    ├─ Return: { requiresOTP: true }
    ├─ Component shows OTP screen
    ├─ User enters OTP code
    └─ Submit to /api/auth (verify-otp)
    
4. API verifies code
   ├─ Fetch user's TOTP secret
   ├─ Verify code with time window
   ├─ OR verify against backup codes
   ├─ Update last_login
   └─ Return authenticated: true
   
5. Component redirects to dashboard
   └─ User is logged in!
```

---

## Security Layers

```
Layer 1: Password Encryption
├─ Password hashed with bcrypt
├─ Salt included
└─ Cannot be reversed

Layer 2: TOTP Secret Storage
├─ Stored in database
├─ Only accessible to owner
└─ Required for code verification

Layer 3: Time-Based Validation
├─ 30-second window
├─ 6-digit code (1 in 1 million)
├─ Time window prevents reuse
└─ Expired codes invalid

Layer 4: Backup Codes
├─ One-time use only
├─ 12 codes generated
├─ Removed after use
└─ For account recovery

Layer 5: Attempt Limiting
├─ Maximum 3 attempts
├─ Exponential backoff possible
├─ Brute force protection
└─ Session invalidation on limit

Layer 6: Session Management
├─ Secure session token
├─ Expires after period
├─ Logout on all devices
└─ Device tracking possible
```

---

## State Management

### Component State

```
SecureLogin.tsx
├─ step: 'credentials' | 'otp' | 'totp'
├─ email: string
├─ password: string
├─ otp: string (6 digits)
├─ totp: string (6 digits)
├─ userId: string
├─ isLoading: boolean
├─ totpAttempts: 0-3
└─ showPassword: boolean

TwoFactorSetup.tsx
├─ step: 'qr' | 'verify' | 'backup' | 'complete'
├─ secret: string (base32)
├─ qrCode: string (base64 image)
├─ verificationCode: string (6 digits)
├─ isLoading: boolean
├─ error: string | null
└─ backupCodes: string[]

AuthenticationSettings.tsx
├─ show2FASetup: boolean
├─ showBackupCodes: boolean
├─ backupCodes: string[]
├─ settings: UserSettings
├─ isLoading: boolean
└─ error: string | null
```

### Database State

```
users table
├─ totp_secret (encrypted)
│  └─ 32-character base32 string
├─ two_factor_enabled
│  └─ true | false
├─ backup_codes (JSON)
│  └─ ["CODE1", "CODE2", ...]
└─ updated_at
   └─ Last modification timestamp
```

---

## Error Handling

```
Setup Errors
├─ Invalid email
├─ Invalid verification code
├─ Secret generation failed
└─ Database update failed

Login Errors
├─ Invalid password
├─ Invalid TOTP code
├─ Invalid backup code
├─ Code expired
├─ 3 attempts exceeded
└─ Session creation failed

Verification Errors
├─ Code outside time window
├─ Backup code already used
├─ Secret not found
├─ Time drift too large
└─ Database access failed

Recovery Options
├─ Try again (up to 3 times)
├─ Use backup code
├─ Return to login
├─ Contact support
└─ Account recovery process
```

---

## Performance Considerations

### Optimization Points

```
1. Database Indexes
   └─ idx_users_two_factor_enabled
      └─ Fast filtering of 2FA users

2. Query Optimization
   ├─ Single query for user + TOTP check
   ├─ No N+1 queries
   └─ Connection pooling with Supabase

3. TOTP Verification
   ├─ Local verification (no network)
   ├─ Time window calculation cached
   └─ O(1) complexity

4. Backup Code Lookup
   ├─ Array search (typically 1-12 items)
   ├─ JSON parsing once per request
   └─ O(n) with small n

5. QR Code Generation
   ├─ Generated client-side
   ├─ No server computation
   └─ Minimal network transfer
```

---

## Scalability

```
User Growth Impact
├─ Database columns added (minimal)
├─ Index added for performance
├─ API endpoints stateless
├─ TOTP verification local
└─ Scales horizontally

Concurrent Users
├─ No session locks
├─ No shared state
├─ Stateless verification
└─ Scales with servers

Data Volume
├─ 50 bytes per TOTP secret
├─ 200 bytes per backup codes
├─ Minimal storage overhead
├─ Index keeps queries fast
```

---

## Security Considerations

### Implemented

✅ TOTP secrets never leave database  
✅ TOTP verification done securely  
✅ Backup codes one-time use  
✅ Passwords hashed with bcrypt  
✅ Attempt limiting prevents brute force  
✅ Time window prevents code reuse  
✅ Sessions properly managed  

### Not Implemented (Future)

⏳ SMS backup 2FA  
⏳ Email backup 2FA  
⏳ WebAuthn/FIDO2  
⏳ Trusted device list  
⏳ 2FA activity logging  
⏳ Recovery codes backup  
⏳ Biometric auth  

---

## Deployment Architecture

```
Production Environment
├─ Application Server (Next.js)
│  ├─ /api/auth endpoints
│  ├─ /api/auth/2fa endpoints
│  └─ Components with SSR
├─ Database (Supabase PostgreSQL)
│  ├─ users table
│  └─ 2FA columns + index
└─ Static Assets
   └─ QR code images
   
User Device
├─ Browser
│  ├─ UI Components
│  └─ Session cookies
└─ Mobile Authenticator
   ├─ TOTP secret
   └─ 6-digit codes
```

---

## Summary

This 2FA system provides:
- ✅ Multi-layer security
- ✅ Excellent user experience
- ✅ Scalable architecture
- ✅ Real-time updates
- ✅ Clear error handling
- ✅ Future extensibility

All components work together seamlessly to provide a secure, user-friendly two-factor authentication system.
