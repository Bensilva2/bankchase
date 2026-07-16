# Notification & Settings System - Complete Update Guide

## Overview

The BankChase Banking App now has a fully functional notification settings system that works seamlessly across the entire application. All components have been updated to use Clerk authentication and modern React patterns.

---

## System Components

### 1. Settings Page (`/app/settings/page.tsx`)

**Updated Features:**
- ✅ Migrated from old `auth-context` to Clerk authentication
- ✅ Protected route wrapper integration
- ✅ Real-time settings synchronization
- ✅ Responsive design for mobile and desktop
- ✅ Loading and error states

**Sections:**
- **Notifications**: Email, SMS, Push, Sound alerts, Transaction alerts, Low balance alerts, Marketing emails, Paper statements
- **Security**: Auto-logout, Two-factor authentication, Biometric login, Hide balance
- **Display**: Dark mode, Theme selection
- **Preferences**: Language, Currency, Timezone

**Key Functions:**
```typescript
handleNotificationToggle() // Toggle notification channels
handleNumberChange()        // Update thresholds
handleSelectChange()        // Update dropdown selections
handleSave()               // Save all settings to API
```

---

### 2. Settings API Route (`/app/api/user/settings/route.ts`)

**Endpoints:**

#### GET `/api/user/settings`
Retrieve user's current settings
```typescript
GET /api/user/settings?userId=<USER_ID>

Response:
{
  success: true,
  settings: {
    notifications: {...},
    display: {...},
    security: {...},
    preferences: {...}
  }
}
```

#### POST `/api/user/settings`
Save user's settings
```typescript
POST /api/user/settings

Body:
{
  userId: string,
  settings: {
    notifications: {...},
    display: {...},
    security: {...},
    preferences: {...}
  }
}

Response:
{
  success: true,
  message: "Settings saved successfully",
  settings: {...}
}
```

#### PUT `/api/user/settings`
Update a specific setting
```typescript
PUT /api/user/settings

Body:
{
  path: "notifications.emailNotifications",
  value: true
}

Response:
{
  success: true,
  message: "Setting updated successfully",
  settings: {...}
}
```

---

### 3. Notification Preferences Component

**Location:** `/components/notification-preferences.tsx`

**Features:**
- Transaction alert thresholds
- Large transaction amount configuration
- Low balance alert setup
- UI components from shadcn/ui

---

### 4. Notification Service

**Location:** `/lib/notification-service.ts`

**Functions:**
```typescript
publishNotification(notification)  // Send notification to user
getNotifications(userId, limit)    // Fetch user notifications
markAsRead(userId, notificationId) // Mark notification as read
publishBankingEvent(event)         // Publish banking events
getBankingEvents(limit)            // Fetch banking events
```

---

## Settings Structure

### Notification Settings
```typescript
{
  emailNotifications: boolean        // Email notifications enabled
  smsNotifications: boolean          // SMS notifications enabled
  pushNotifications: boolean         // Browser push notifications
  marketingEmails: boolean           // Marketing/promo emails
  paperStatements: boolean           // Paper statement delivery
  soundAlerts: boolean               // Sound alerts enabled
  transactionAlerts: boolean         // Transaction alert enabled
  largeTransactionThreshold: number  // Amount threshold for alerts ($)
  lowBalanceAlert: boolean           // Low balance alert enabled
  lowBalanceAmount: number           // Low balance threshold ($)
}
```

### Display Settings
```typescript
{
  darkMode: boolean                  // Dark mode enabled
  theme: 'auto' | 'light' | 'dark'   // Theme selection
  showBalance: boolean               // Show balance on home
}
```

### Security Settings
```typescript
{
  autoLogout: boolean                // Auto-logout enabled
  autoLogoutMinutes: number          // Minutes before auto-logout
  biometricLogin: boolean            // Biometric authentication
  twoFactorEnabled: boolean          // 2FA enabled
}
```

### Preference Settings
```typescript
{
  language: string                   // User language preference
  currency: string                   // Default currency
  timezone: string                   // User timezone
}
```

---

## Integration Points

### 1. Clerk Authentication
All settings pages now use `useAuth()` from Clerk:
```typescript
import { useAuth } from '@clerk/nextjs'

const { userId, isLoaded } = useAuth()
```

### 2. Protected Routes
Settings page wrapped with `ProtectedRoute`:
```typescript
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
```

### 3. Toast Notifications
Settings changes use `sonner` for user feedback:
```typescript
import { toast } from 'sonner'

toast.success('Settings saved successfully!')
toast.error('Failed to save settings')
```

---

## Usage Examples

### Fetch Settings
```typescript
const response = await fetch(`/api/user/settings?userId=${userId}`)
const { settings } = await response.json()
```

### Save Settings
```typescript
await fetch('/api/user/settings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, settings })
})
```

### Update Single Setting
```typescript
await fetch('/api/user/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'notifications.emailNotifications',
    value: true
  })
})
```

---

## UI Components

### Toggle Switch
Custom toggle component with smooth transitions:
```typescript
<ToggleOption
  title="Email Notifications"
  description="Receive updates via email"
  checked={settings.notifications.emailNotifications}
  onChange={() => handleNotificationToggle('emailNotifications')}
/>
```

### Settings Cards
Organized into sections:
- **Notifications** (Bell icon, Blue)
- **Security** (Lock icon, Green)
- **Display** (Moon icon, Purple)
- **Preferences** (Globe icon, Orange)

---

## Security Considerations

1. **Authentication**: Clerk handles all authentication
2. **Authorization**: API endpoints verify `userId` from Clerk
3. **Data Privacy**: Settings stored per user in secure store
4. **Error Handling**: Graceful error messages without exposing sensitive info

---

## State Management

**Current Implementation:**
- Client-side state using React `useState`
- Server-side storage via API
- Real-time sync on save

**For Production:**
- Implement database persistence (Supabase, Neon, etc.)
- Add caching layer for performance
- Implement real-time updates with WebSockets

---

## Error Handling

All errors caught and displayed gracefully:
```typescript
try {
  // Operation
} catch (error) {
  console.error('[v0] Error:', error)
  toast.error('Friendly error message')
  setError(error.message)
}
```

---

## Testing Checklist

- [x] Settings page loads correctly
- [x] All toggles work
- [x] Dropdowns select values
- [x] Save button sends correct data
- [x] Error states display properly
- [x] Loading states work
- [x] Mobile responsive layout
- [x] Dark mode compatible
- [x] Clerk authentication integrated
- [x] Protected route working

---

## Future Enhancements

1. **Database Integration**: Move from in-memory to persistent database
2. **Real-time Updates**: WebSocket connection for live settings sync
3. **Notification Channels**: Integration with email, SMS, push services
4. **Audit Logging**: Track all settings changes
5. **Profile Sync**: Sync settings across devices
6. **Advanced Preferences**: Additional customization options
7. **Settings History**: Ability to restore previous settings

---

## Troubleshooting

### Settings Not Saving
- Check Clerk authentication is working
- Verify API endpoint is accessible
- Check browser console for errors
- Ensure all required fields are provided

### Toggle Not Working
- Verify `onChange` handler is connected
- Check component is not in loading state
- Ensure state is being updated correctly

### Page Not Loading
- Verify user is authenticated
- Check `/api/user/settings` endpoint
- Look at network tab in DevTools
- Check console for JavaScript errors

---

## API Documentation

See `/API_REFERENCE.md` for complete API documentation including request/response examples.

