# Real-Time Transaction Alert System

## Overview

The Real-Time Transaction Alert System delivers flash notifications to users immediately when transactions occur. Alerts are sent via multiple channels: email, SMS, and push notifications - all working in real-time with proper synchronization.

## Features

✅ **Real-Time Delivery** - Instant notifications when transactions occur
✅ **Multi-Channel Support** - Email, SMS, and Push notifications
✅ **Receiver Notifications** - Recipient gets alerts with transaction details
✅ **Sender Notifications** - Sender gets confirmation alerts
✅ **Flash Alerts** - On-screen notifications with auto-dismiss
✅ **Connection Status** - Live indicator showing alert stream connectivity
✅ **Retry Mechanism** - Automatic reconnection on connection loss
✅ **Alert History** - Track all alerts with status and timestamps
✅ **Customizable Preferences** - Users control notification channels
✅ **Error Handling** - Graceful failure recovery with retry logic

## Architecture

### Database Schema

#### transaction_alerts Table
- Stores alert delivery records
- Tracks delivery status (pending, sent, failed)
- Links transactions to notification history

#### notification_preferences Table
- User notification preferences
- Toggle email/SMS/push on/off
- Store contact information

#### notifications Table (Enhanced)
- Transaction-linked notifications
- In-app notification tracking
- Metadata support for rich content

### Real-Time Components

#### Transaction Alert Service (/lib/transaction-alert-service.ts)
- Main service for sending alerts
- Handles multi-channel delivery
- Manages retry logic
- Formats alert messages

#### Email Notifications (/app/api/notifications/email/route.ts)
- Email delivery handler
- Professional HTML templates
- Real-time sending via queue

#### SMS Notifications (/app/api/notifications/sms/route.ts)
- SMS delivery handler
- Text formatting for SMS
- Phone number validation

#### Push Notifications (/app/api/notifications/push/route.ts)
- Push notification delivery
- Browser push support
- Device notification routing

#### Alert Stream API (/app/api/alerts/stream/route.ts)
- Real-time alert streaming via Server-Sent Events (SSE)
- Live connection to receive alerts
- Automatic reconnection on disconnect

## Usage

### 1. Display Transaction Alerts Dashboard

```tsx
import { TransactionAlertDashboard } from '@/components/transaction-alert-dashboard'

export function MyDashboard() {
  const user = useUser() // Get current user

  return (
    <TransactionAlertDashboard
      userId={user?.id}
      title="Transaction Alerts"
      showConnectionStatus={true}
    />
  )
}
```

### 2. Use the Alert Hook Directly

```tsx
import { useTransactionAlerts } from '@/hooks/use-transaction-alerts'

export function MyComponent() {
  const { alerts, isConnected, isLoading, retry } = useTransactionAlerts(userId)

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Alerts Received: {alerts.length}</p>
      {!isConnected && <button onClick={retry}>Reconnect</button>}
    </div>
  )
}
```

### 3. Display Flash Alerts

```tsx
import { AlertContainer } from '@/components/flash-alert'

export function MyPage() {
  const [alerts, setAlerts] = useState([])

  const handleAlertClose = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <>
      <AlertContainer alerts={alerts} onAlertClose={handleAlertClose} />
      {/* Your page content */}
    </>
  )
}
```

## Alert Flow

### When a Transaction is Made

1. **Transaction Created**
   - API creates transaction record in database

2. **Alert Service Triggered**
   - `TransactionAlertService.sendAlert()` is called
   - Retrieves user contact information (email, phone)
   - Generates alert message with transaction details

3. **Multi-Channel Delivery**
   - **Email**: Sends HTML email notification
   - **SMS**: Sends text message to recipient
   - **Push**: Sends browser push notification
   - **In-App**: Creates notification in database

4. **Real-Time Stream Update**
   - Alert stream broadcasts to connected clients
   - Dashboard receives alert and displays flash notification
   - Auto-dismisses after 8 seconds

5. **Status Tracking**
   - Each alert tracked with delivery status
   - Retry on failure (up to 3 attempts)
   - History maintained for audit trail

## Configuration

### Enable/Disable Channels

```typescript
// User preferences
const preferences = {
  enable_email: true,    // Email notifications
  enable_sms: true,      // SMS notifications
  enable_push: true,     // Browser push notifications
  phone_number: '+1234567890',
  email_address: 'user@example.com'
}
```

### Update Preferences via API

```typescript
const response = await fetch('/api/notifications/preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-id',
    enable_email: true,
    enable_sms: false,
    enable_push: true,
    phone_number: '+1234567890'
  })
})
```

## Real-Time Functionality

### Alert Stream Connection

The system uses **Server-Sent Events (SSE)** for real-time delivery:

```typescript
// Automatic connection via hook
const { alerts, isConnected } = useTransactionAlerts(userId)

// Manual stream connection
const eventSource = new EventSource(`/api/alerts/stream?userId=${userId}`)

eventSource.onmessage = (event) => {
  const alert = JSON.parse(event.data)
  console.log('New alert:', alert)
}

eventSource.onerror = () => {
  console.log('Connection lost, retrying...')
  // Automatic reconnection after 3 seconds
}
```

### Connection Status Indicators

- **Connected**: Green indicator, alerts flowing in real-time
- **Disconnected**: Red indicator, attempting to reconnect
- **Reconnecting**: Yellow indicator with spinner

### Automatic Reconnection

- Triggers when connection is lost
- Waits 3 seconds before attempting reconnection
- Retries indefinitely until successful
- No alerts missed - all new alerts queued

## Alert Types

### Success Alerts
- Successful transaction sent
- Recipient received funds
- Payment processed

### Error Alerts
- Transaction failed
- Delivery failed
- Insufficient funds

### Warning Alerts
- Large transaction
- Unusual activity
- Multiple failed attempts

### Info Alerts
- Scheduled transaction coming
- Account activity
- Security notices

## Message Templates

### Email Template

```
Subject: Transaction Alert: $500 Sent

Dear [User Name],

A transaction has been completed on your account:

Amount: $500.00
Recipient: [Recipient Name]
Type: Money Transfer
Time: [Timestamp]
Reference: [Reference Number]

Account Balance: $[Balance]

If you did not authorize this transaction, please contact support immediately.

Best regards,
Chase Bank
```

### SMS Template

```
Chase: $500 sent to [Recipient]. Available balance: $[Balance]. 
Reply STOP to unsubscribe.
```

## Error Handling

### Retry Logic
- First attempt: immediate
- Failed attempt 1: retry after 1 second
- Failed attempt 2: retry after 5 seconds
- Failed attempt 3: mark as failed, log for review

### Fallback Behavior
- If email fails: retry SMS
- If SMS fails: show in-app alert
- If all fail: mark as failed and log

### Connection Recovery
- Automatic reconnection every 3 seconds
- Exponential backoff if connection unstable
- Manual retry button available to users

## Security

- User can only receive alerts for their own transactions
- Row Level Security (RLS) ensures data isolation
- Alert history only accessible to relevant user
- Notification preferences protected per user
- Contact information encrypted at rest

## Performance

- Stream updates limited to 1 per second
- Alert batching for high volume
- In-memory alert cache (last 10 alerts)
- Database indexes on user_id and created_at
- Connection pooling for database

## Integration Points

### 1. Transaction API
```typescript
// Automatically triggers alerts
POST /api/transactions
```

### 2. Notification Preferences
```typescript
// Configure user preferences
POST /api/notifications/preferences
GET /api/notifications/preferences
```

### 3. Alert Stream
```typescript
// Real-time alert receiving
GET /api/alerts/stream?userId=[userId]
```

### 4. Dashboard Component
```tsx
<TransactionAlertDashboard userId={userId} />
```

## Testing

### Test Email Alert
```bash
curl -X POST http://localhost:3000/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Alert",
    "message": "Test message"
  }'
```

### Test SMS Alert
```bash
curl -X POST http://localhost:3000/api/notifications/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test SMS alert"
  }'
```

### Test Stream Connection
```javascript
const es = new EventSource('/api/alerts/stream?userId=test-user-id')
es.onmessage = (e) => console.log(JSON.parse(e.data))
```

## Troubleshooting

### Alerts Not Appearing
1. Check user ID is correct
2. Verify notification preferences enabled
3. Check browser console for connection errors
4. Try manual reconnect button

### Connection Keeps Dropping
1. Check network stability
2. Verify firewall not blocking SSE
3. Check browser console for errors
4. Increase connection timeout if needed

### Email Not Received
1. Check email address is correct
2. Verify email preferences enabled
3. Check spam folder
4. Review delivery logs

### SMS Not Received
1. Verify phone number format
2. Check SMS preferences enabled
3. Ensure account has SMS credits
4. Review provider logs

## Best Practices

1. **Always enable email alerts** for important transactions
2. **Monitor connection status** on dashboard
3. **Test alerts** before going live
4. **Set up preferences** for each user
5. **Review failure logs** regularly
6. **Implement proper error handling** in client
7. **Use exponential backoff** for retries
8. **Log all alert events** for compliance

## Future Enhancements

- Webhook notifications
- Telegram/WhatsApp integration
- Alert scheduling
- Template customization
- Alert filtering
- Batch notifications
- Rich media support
- Deep linking to transactions
