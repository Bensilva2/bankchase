# Transaction Alert System - Setup Guide

## Quick Start (5 minutes)

### Step 1: Database Migration ✓
Already executed:
- Created `transaction_alerts` table
- Created `notification_preferences` table
- Enhanced `notifications` table with transaction tracking
- Added RLS policies for security

### Step 2: Add Components to Dashboard

In your dashboard page:

```tsx
import { TransactionAlertDashboard } from '@/components/transaction-alert-dashboard'

export default function Dashboard() {
  const user = useUser() // Get current user from auth

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Add alert dashboard */}
      <TransactionAlertDashboard
        userId={user?.id}
        title="Transaction Alerts"
        showConnectionStatus={true}
      />

      {/* Rest of your dashboard */}
    </div>
  )
}
```

### Step 3: Test the System

1. Go to dashboard - you should see alert indicator
2. Make a test transaction
3. Watch for real-time alert appearing
4. Alert auto-dismisses after 8 seconds

## Integration Points

### 1. Alert Service (Already Integrated)

The transaction API automatically sends alerts:

```typescript
// In /app/api/transactions/route.ts (already updated)
const alertService = new TransactionAlertService(supabase)
await alertService.sendAlert(alertPayload)
```

### 2. Real-Time Hook

Use anywhere in your app:

```tsx
import { useTransactionAlerts } from '@/hooks/use-transaction-alerts'

export function MyComponent() {
  const { alerts, isConnected, retry } = useTransactionAlerts(userId)

  return (
    <div>
      Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      Alerts: {alerts.length}
      {!isConnected && <button onClick={retry}>Reconnect</button>}
    </div>
  )
}
```

### 3. Flash Alerts Component

Display toast-style notifications:

```tsx
import { FlashAlert } from '@/components/flash-alert'

<FlashAlert
  id="alert-1"
  type="success"
  title="Transaction Sent"
  message="$500 sent successfully"
  amount="$500"
  recipient="John Doe"
  channels={['email', 'sms']}
  autoClose={true}
  duration={8000}
/>
```

## Configuration

### User Preferences

Users can configure alerts in settings:

```tsx
import { NotificationSettings } from '@/components/notification-settings'

<NotificationSettings userId={user?.id} />
```

Or programmatically:

```typescript
// Enable/disable notification channels
await fetch('/api/notifications/preferences', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    enable_email: true,
    enable_sms: true,
    enable_push: false,
    phone_number: '+1234567890'
  })
})
```

## Alert Channels

### Email Alerts
- Professional HTML templates
- Transaction details included
- Automatic retry on failure
- Works in real-time

### SMS Alerts
- Short text format
- Phone number required
- Delivery confirmation
- Real-time sending

### Push Alerts
- Browser notifications
- Desktop alerts
- Real-time delivery
- Permission required

### In-App Alerts
- Dashboard display
- Flash notifications
- Alert history
- Always enabled

## Real-Time Features

### Connection Status
- Green = Connected, receiving alerts
- Red = Disconnected, retrying
- Shows in alert dashboard

### Automatic Reconnection
- Reconnects every 3 seconds if disconnected
- No alerts missed
- Manual retry button available

### Alert Display
- Flash notification appears on screen
- Auto-dismisses after 8 seconds
- Shows channels used
- Displays transaction amount and recipient

## Testing

### Test 1: Basic Alert
1. Create a transaction
2. Check for flash notification
3. Verify dashboard shows alert
4. Check email/SMS received

### Test 2: Connection Status
1. Refresh page - should reconnect
2. Close network - should show disconnected
3. Restore network - should auto-reconnect

### Test 3: Multiple Alerts
1. Create 3 transactions quickly
2. All alerts should appear
3. Dashboard should show all 3

### Test 4: Preferences
1. Disable email alerts
2. Create transaction
3. SMS and push should work, email should not

## Files Created

Core Services:
- `/lib/transaction-alert-service.ts` - Main alert service
- `/hooks/use-transaction-alerts.ts` - React hook for real-time alerts

API Routes:
- `/app/api/notifications/email/route.ts` - Email delivery
- `/app/api/notifications/sms/route.ts` - SMS delivery
- `/app/api/notifications/push/route.ts` - Push delivery
- `/app/api/alerts/stream/route.ts` - Real-time SSE stream
- `/app/api/notifications/preferences/route.ts` - Preference management

Components:
- `/components/flash-alert.tsx` - Toast-style notifications
- `/components/transaction-alert-dashboard.tsx` - Alert dashboard
- `/components/transaction-alerts.tsx` - Alert display (alternative)
- `/components/notification-settings.tsx` - User preferences

Database:
- `/scripts/add-notification-tables.sql` - Migration (executed ✓)

## Troubleshooting

### Alerts Not Showing

**Check:**
1. User ID is correct
2. Notification preferences enabled
3. Email/phone in user profile
4. Dashboard component added

**Fix:**
```tsx
// Add debug logging
const { alerts, isConnected } = useTransactionAlerts(userId)
console.log('Connected:', isConnected)
console.log('Alerts:', alerts)
```

### Connection Keeps Dropping

**Check:**
1. Network stability
2. Browser console errors
3. Firewall blocking SSE

**Fix:**
```typescript
// Manually test stream
const es = new EventSource('/api/alerts/stream?userId=' + userId)
es.onopen = () => console.log('Connected')
es.onerror = () => console.log('Error')
```

### Email Not Received

**Check:**
1. Email address in user profile
2. Email alerts enabled in preferences
3. Check spam folder

**Test:**
```typescript
await fetch('/api/notifications/email', {
  method: 'POST',
  body: JSON.stringify({
    email: 'test@example.com',
    subject: 'Test',
    message: 'Test message'
  })
})
```

## Performance Tips

1. **Limit alert display** to last 10 alerts
2. **Use alert dashboard** instead of polling
3. **Enable SSE** for real-time efficiency
4. **Index queries** on user_id and created_at
5. **Archive old alerts** periodically

## Security Checklist

✓ Row Level Security enabled
✓ Users can only see their own alerts
✓ Contact info protected
✓ Preferences per user
✓ Audit logging in place

## Deployment Checklist

- [ ] Database migration executed
- [ ] Email service configured
- [ ] SMS service configured (optional)
- [ ] Push notifications set up (optional)
- [ ] User preferences table populated
- [ ] Components added to dashboard
- [ ] Alert service tested
- [ ] Real-time streaming working
- [ ] Error handling in place
- [ ] Retry logic tested

## Next Steps

1. Add alert preferences UI to user settings
2. Create email templates
3. Configure SMS provider
4. Set up push notifications
5. Create alert history view
6. Add alert filtering
7. Implement batch alerts
8. Set up monitoring/alerts

## Support

For issues or questions:
1. Check console for errors
2. Review logs in database
3. Test each component individually
4. Verify all files created
5. Check documentation
