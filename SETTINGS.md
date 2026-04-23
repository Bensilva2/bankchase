# Chase Banking App - Real-Time Settings System

This document explains how all settings work together in real-time to provide a Chase Bank-like experience with full functionality and security.

## Table of Contents

1. [Security & Privacy](#security--privacy)
2. [Notifications](#notifications)
3. [Language & Region](#language--region)
4. [Biometric & Auto-Lock](#biometric--auto-lock)
5. [Privacy Settings](#privacy-settings)
6. [Data Permissions](#data-permissions)
7. [Accessibility](#accessibility)
8. [How Settings Work Together](#how-settings-work-together)

---

## Security & Privacy

### Password Management
- **Change Password**: Update your password with validation
- **PIN Management**: Change your 4-digit card PIN
- **Last Changed**: Tracks when password/PIN were last updated
- **Password Requirements**: 8+ characters, uppercase, lowercase, number

### Two-Factor Authentication (2FA)
**Real-Time Enforcement**: When enabled, 2FA is required at login

- **Methods Available**:
  - SMS: Sends code to your phone `(555) 888-9999`
  - Email: Sends code to `hungchun164@gmail.com`
  - Authenticator App: Use Google Authenticator or similar

- **How It Works**:
  1. Enable 2FA in Security & Privacy settings
  2. Choose verification method (SMS/Email/Authenticator)
  3. Verify with 6-digit code
  4. Save backup codes (8 codes generated)
  5. Next login requires 2FA verification

- **Real-Time Effect**: Login screen shows 2FA verification step immediately after enabling

### Trusted Devices
- **View Devices**: See all devices logged into your account
- **Device Details**: Name, type, last active time, location, IP address
- **Remove Devices**: Sign out devices remotely
- **Current Device**: Marked with indicator

### Login History
- **Track Activity**: View all login attempts
- **Details Shown**: Date, time, device, location, status (success/failed), IP address
- **Security Monitoring**: Detect unauthorized access attempts

### Backup Codes
- **Generate Codes**: Create 8 one-time backup codes
- **Download**: Save codes as text file
- **Copy**: Copy all codes to clipboard
- **Usage**: Use when primary 2FA method unavailable

---

## Notifications

### Push Notifications
**Real-Time**: Enabled/disabled immediately

- **When Enabled**: Receive in-app notifications for:
  - Transactions (money sent/received)
  - Bill due dates
  - Security alerts (new device login)
  - Rewards points earned
  - Low balance warnings

- **Requirements**: "Notifications" permission in Data Permissions must be enabled

### Email Notifications
- **Transaction Confirmations**: Receipt sent to email
- **Security Alerts**: Suspicious activity notifications
- **Statement Ready**: Monthly statement availability
- **Marketing**: Promotional offers (can be disabled)

### SMS Alerts
- **Text Messages**: Receive SMS for critical events
- **Phone Number**: Sent to `(555) 888-9999`
- **Real-Time**: Instantly enabled/disabled

### Transaction Alerts
**Real-Time Enforcement**: When enabled, shows toast notification for every transaction

- **Credit Transactions**: "Money Received" notification
- **Debit Transactions**: "Payment Made" notification
- **Details**: Amount, description, account

### Balance Alerts
**Real-Time Monitoring**: Continuously checks balance against threshold

- **Alert Threshold**: Default $1,000 (customizable)
- **Trigger**: When account balance falls below threshold
- **Example**: Balance drops to $950 → Immediate alert notification
- **Settings**: Adjust threshold in $100 increments

### Login Alerts
**Real-Time**: Notification on every login

- **New Device**: "New device login detected"
- **Location**: Shows login location
- **Device Info**: Device type and browser

---

## Language & Region

### Language Selection
**Real-Time Translation**: UI text changes immediately

- **Available Languages**:
  - English (default)
  - Spanish (Español)
  - French (Français)
  - Chinese (中文)

- **What Changes**:
  - Navigation labels
  - Greeting messages ("Good morning" → "Buenos días")
  - Button text
  - Menu items

### Time Zone
- **Auto-Detection**: Uses device timezone
- **Manual Override**: Choose from US time zones
- **Options**: ET, CT, MT, PT, AKT, HST
- **Effect**: All timestamps display in selected timezone

### Currency
- **Display Format**: Changes $ symbol and formatting
- **Options**: USD, EUR, GBP, JPY
- **Real-Time**: All amounts update immediately

---

## Biometric & Auto-Lock

### Biometric Login
**Real-Time Enforcement**: Required at login and unlock

- **Face ID**: Uses device facial recognition
- **Touch ID**: Uses fingerprint sensor
- **How It Works**:
  1. Enable in settings
  2. Grant Face ID/Touch ID permission in Data Permissions
  3. Next login prompts for biometric
  4. Simulates biometric check (500ms delay)
  5. Success → App unlocked

### Auto Lock
**Real-Time Activity Monitoring**: Continuously tracks user interaction

- **How It Works**:
  1. Enable Auto Lock in settings
  2. Set Session Timeout (5/10/15/30/60 minutes)
  3. Activity monitor tracks:
     - Mouse movements
     - Keyboard input
     - Touch events
     - Scroll events
  4. No activity for timeout period → App locks
  5. Shows lock screen with unlock button

- **Session Timeout Options**:
  - 5 minutes: High security
  - 15 minutes: Balanced (default)
  - 60 minutes: Convenience

- **Unlock Process**:
  - If Biometric enabled: Requires Face ID/Touch ID
  - If Biometric disabled: Simple unlock button
  - Option to sign out instead

---

## Privacy Settings

### Share Data with Partners
- **Control**: Enable/disable data sharing with third parties
- **Effect**: Prevents sharing financial data with partner companies

### Personalized Ads
- **Control**: Enable/disable targeted advertising
- **Effect**: Shows generic ads instead of personalized

### Location Services
- **Control**: Enable/disable location tracking
- **Uses**: Find nearby ATMs, branches, location-based offers
- **Requirement**: "Location" permission in Data Permissions

### Analytics Tracking
- **Control**: Enable/disable app usage analytics
- **Effect**: Stops sending usage data for improvement

### Account Visibility
- **Options**: Private, Contacts, Public
- **Private**: Only you can see your account
- **Contacts**: People in your contacts can see
- **Public**: Anyone can view

### Show Profile Photo
- **Control**: Display/hide profile picture
- **Effect**: Shows avatar instead of photo when disabled

### Show Online Status
- **Control**: Display/hide online indicator
- **Effect**: Others can't see when you're active

---

## Data Permissions

**Real-Time Enforcement**: Features disabled when permission denied

### Camera Access
- **Purpose**: Mobile check deposit, profile photos
- **When Denied**: Check deposit feature shows permission request
- **Grant**: Enable in settings → Check deposit works immediately

### Photo Library
- **Purpose**: Upload images, attach receipts
- **When Denied**: Upload buttons disabled
- **Grant**: Enable → Upload features activate

### Contacts
- **Purpose**: Zelle payments, send money to contacts
- **When Denied**: Manual entry required for recipients
- **Grant**: Enable → Contact list appears in send money

### Location
- **Purpose**: Find ATMs, branches, location-based security
- **When Denied**: Location features unavailable
- **Grant**: Enable → ATM finder works immediately

### Notifications
- **Purpose**: Push notifications, alerts
- **When Denied**: No push notifications (email/SMS still work)
- **Grant**: Enable → Notifications appear immediately

### Face ID
- **Purpose**: Biometric authentication
- **When Denied**: Biometric login disabled
- **Grant**: Enable → Face ID authentication available

### Touch ID
- **Purpose**: Fingerprint authentication
- **When Denied**: Biometric login disabled
- **Grant**: Enable → Touch ID authentication available

---

## Accessibility

### Text Size
**Real-Time**: UI text size changes immediately

- **Options**:
  - Small: `text-sm` (14px)
  - Medium: `text-base` (16px) - Default
  - Large: `text-lg` (18px)
  - Extra Large: `text-xl` (20px)

- **What Changes**:
  - All body text
  - Button labels
  - Form inputs
  - Navigation items

### High Contrast
**Real-Time**: Color scheme changes immediately

- **Effect**:
  - Pure black/white backgrounds
  - Stronger border colors (2px instead of 1px)
  - Thicker focus outlines (4px instead of 3px)
  - Higher color contrast ratios
  - No gradients or subtle colors

- **Dark Mode Compatible**: Works in both light and dark themes

### Reduce Motion
**Real-Time**: Animations disabled immediately

- **Effect**:
  - All animations set to 0.01ms (instant)
  - No transitions
  - No transforms
  - Spinner animations removed
  - Smooth scrolling disabled
  - Auto-scroll behavior: instant

- **Why**: Helps users with vestibular disorders or motion sensitivity

### Screen Reader Support
- **ARIA Labels**: All interactive elements labeled
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: Images have descriptions
- **Focus Management**: Logical tab order

### Voice Control
- **Placeholder**: Future feature for voice commands
- **When Enabled**: Voice recognition for actions

---

## How Settings Work Together

### Example 1: Transaction with Round-Up Savings
\`\`\`
1. User sends $25.50 via Zelle
2. Round-Up Savings enabled → Rounds to $26.00
3. Transaction Alerts enabled → Shows "Money Sent" notification
4. Push Notifications enabled → Toast appears
5. Email Notifications enabled → Receipt sent to email
6. Round-up $0.50 added to Savings account
7. Activity logged: "Sent $25.50 via Zelle"
\`\`\`

### Example 2: Auto-Lock Flow
\`\`\`
1. User opens app at 2:00 PM
2. Auto Lock enabled, timeout: 15 minutes
3. User inactive from 2:05 PM to 2:20 PM (15+ minutes)
4. System checks inactivity at 2:20 PM
5. Triggers lock screen
6. Biometric Login enabled
7. Shows "Use biometric to unlock" screen
8. User taps unlock → Face ID prompt
9. Success → App unlocks, activity timer resets
\`\`\`

### Example 3: Low Balance Alert
\`\`\`
1. User has $1,200 in checking account
2. Balance Alerts enabled, threshold: $1,000
3. User pays bill for $250
4. New balance: $950 (below threshold)
5. System detects: $950 < $1,000
6. Triggers notification: "Low Balance Alert"
7. Push Notifications enabled → Toast appears
8. SMS Alerts enabled → Text message sent
9. Transaction recorded with alert flag
\`\`\`

### Example 4: 2FA Login
\`\`\`
1. User enters username and password
2. Credentials valid
3. System checks: 2FA enabled
4. Shows 2FA verification screen
5. Method: SMS
6. Sends 6-digit code to (555) 888-9999
7. User enters code
8. Code verified
9. Biometric Login enabled → Shows Face ID prompt
10. Face ID success → Login complete
11. Login Alerts enabled → Sends security notification
12. Activity logged with device and location
\`\`\`

### Example 5: Accessibility Mode
\`\`\`
1. User enables High Contrast
2. Colors change to pure black/white
3. User enables Reduce Motion
4. All animations become instant
5. User sets Text Size to Large
6. All text increases to 18px
7. Dark Mode enabled
8. High contrast dark theme applies
9. User navigates with keyboard
10. Focus indicators show clearly (4px outline)
\`\`\`

---

## Settings Persistence

### LocalStorage
- **All settings** saved to browser localStorage
- **Instant saving**: Changes saved immediately
- **Cross-session**: Settings persist after logout
- **Same browser**: Settings available across tabs

### Cloud Sync
- **Auto-sync**: Every 30 seconds
- **On-change**: Triggered 2 seconds after any change
- **Cross-device**: Settings sync across devices
- **Offline support**: Changes saved locally, synced when online
- **Merge strategy**: Latest timestamp wins

### Data Structure
\`\`\`javascript
{
  userProfile: {...},
  accounts: [...],
  transactions: [...],
  appSettings: {
    darkMode: true,
    language: "English",
    biometricLogin: true,
    autoLockEnabled: true,
    sessionTimeout: 15,
    twoFactorAuth: true,
    pushNotifications: true,
    transactionAlerts: true,
    balanceAlerts: true,
    balanceThreshold: 1000,
    roundUpSavings: true,
    textSize: "large",
    highContrast: false,
    reduceMotion: false,
    // ... all other settings
  },
  savedAt: "2024-12-15T10:30:00.000Z"
}
\`\`\`

---

## Real-Time Features Summary

| Feature | Real-Time Effect | Requires Permission | Persists |
|---------|-----------------|---------------------|----------|
| 2FA | Login screen changes | - | ✅ |
| Biometric | Unlock prompt appears | Face ID/Touch ID | ✅ |
| Auto-Lock | App locks after timeout | - | ✅ |
| Transaction Alerts | Toast notification | Push/Email/SMS | ✅ |
| Balance Alerts | Immediate notification | Push/Email/SMS | ✅ |
| Round-Up Savings | Auto-adds to savings | - | ✅ |
| Language | UI text translates | - | ✅ |
| Dark Mode | Colors change | - | ✅ |
| High Contrast | Accessibility mode | - | ✅ |
| Reduce Motion | Animations stop | - | ✅ |
| Text Size | Font size changes | - | ✅ |
| Camera Access | Check deposit enabled | Camera | ✅ |
| Location | ATM finder enabled | Location | ✅ |

---

## Developer Notes

### Settings Enforcer
Located in `lib/settings-enforcement.ts`, the `SettingsEnforcer` class:
- Monitors user activity for auto-lock
- Checks biometric requirements
- Validates 2FA status
- Enforces data permissions
- Applies round-up savings calculations
- Determines notification delivery methods
- Checks alert thresholds
- Translates text based on language
- Returns text size classes

### Integration Points
1. **Login**: Checks 2FA and biometric settings
2. **Transactions**: Applies round-up, sends alerts
3. **Balance Changes**: Monitors threshold, sends alerts
4. **UI Rendering**: Applies text size, contrast, motion settings
5. **Permissions**: Enforces data access restrictions

### Testing
All settings work offline and online, persist across sessions, and sync across devices using the same browser or different browsers/devices through cloud sync.

---

**Last Updated**: December 2024  
**Version**: 1.0.0
