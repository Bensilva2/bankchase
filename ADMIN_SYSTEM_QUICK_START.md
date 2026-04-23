# Admin Transfer System - Quick Start Guide

## What Was Built

A complete admin fund transfer system with:
- Admin dashboard to manage user accounts and transfers
- Multi-channel notifications (SMS, Push, Email, Browser)
- Real-time device registration for notifications
- OTP verification for secure transfers
- Real-time fund deposits with instant alerts
- Audit logging and transfer history

## Quick Setup

### 1. Database Migration Already Run
The database migration has already been executed. It created these tables:
- `admin_transfers` - Transfer records
- `device_registrations` - User devices for notifications
- `notification_logs` - Notification delivery tracking
- `audit_logs` - Admin action audit trail

### 2. Access the Admin Dashboard

```
URL: http://localhost:3000/admin
```

Only users with `role = 'admin'` can access this page.

To make a user admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Files Created/Modified

**New API Endpoints:**
- `/api/admin/users/route.ts` - Manage users
- `/api/admin/transfers/route.ts` - Process transfers with OTP
- `/api/admin/transfer-alerts/route.ts` - Send alerts
- `/api/devices/register/route.ts` - Device registration
- `/api/notifications/sms/route.ts` - Enhanced SMS (multi-device)
- `/api/notifications/push/route.ts` - Enhanced push (multi-device)

**New Dashboard Components:**
- `/app/admin/page.tsx` - Main admin dashboard
- `/components/admin/admin-transfer-form.tsx` - Transfer form with OTP
- `/components/admin/admin-users-list.tsx` - New users listing
- `/components/admin/admin-transfer-history.tsx` - Transfer history table

**New Services:**
- `/lib/device-registration-service.ts` - Device registration utilities
- `/lib/admin-transfer-alert-service.ts` - Multi-channel alert service

## How to Use

### Step 1: Create Test User

Sign up a new user through the login page:
1. Click "Sign up for Chase online"
2. Fill in personal information
3. Complete identity verification
4. Create credentials
5. Grant notification permissions

Account automatically registered for notifications.

### Step 2: Go to Admin Dashboard

1. Log in as admin user
2. Navigate to `/admin` 
3. You'll see dashboard with:
   - New users count
   - Pending transfers
   - Completed transfers count

### Step 3: Send Funds to New User

**On "Pending Transfers" Tab:**

1. Click "Transfer Funds to New Account"
2. **Select User**: Choose recipient from dropdown
3. **Select Account**: Choose their account (checking, savings, etc)
4. **Amount**: Enter dollar amount
5. **Description**: Optional (e.g., "Welcome bonus")
6. Click **"Initiate Transfer"**

System will:
- Generate 6-digit OTP
- Send OTP to your email
- Show confirmation step

### Step 4: Confirm with OTP

1. Check your email for OTP code
2. Enter 6-digit code in the form
3. Click **"Confirm Transfer"**

Once confirmed:
- Funds are deposited immediately
- SMS sent to recipient's phone
- Push notifications sent to all their devices
- Browser notification appears (if app open)
- Email confirmation sent
- Transaction recorded
- Audit log created

### Step 5: View History

Click **"Transfer History"** tab to see:
- All transfers ever made
- Recipient names and accounts
- Transfer amounts
- Status (Completed, Pending, Failed)
- Dates and times

## Real-Time Notifications Explained

When you complete a transfer, the recipient gets alerts via:

1. **SMS** - Immediate text message
   - "Chase Alert: $500 added to Checking. Ref: abc12345"

2. **Push Notifications** - On all registered devices
   - iOS phones/tablets (APNs)
   - Android phones/tablets (FCM)
   - Web browsers (Web Push)
   - All devices receive notification simultaneously

3. **Browser Notification** - If app is open
   - Pop-up in browser corner
   - Requires notification permission granted during signup

4. **Email** - Detailed receipt
   - Amount, account, timestamp, reference number
   - Safe for record keeping

## Testing Notifications

### Test SMS
1. Sign up with a valid phone number
2. Complete transfer
3. Check phone for text message
4. Message appears in browser console logs

### Test Push Notifications
1. Grant notification permission when prompted
2. Register current device
3. Sign up on different device (phone, tablet, etc)
4. Send transfer to that user
5. All devices receive notification

### Test Browser Notification
1. Make sure app is open in browser
2. Send transfer to test user
3. Notification should appear in browser corner
4. Click to focus the app

## Database Queries for Testing

### See all transfers
```sql
SELECT 
  t.id, 
  u.name, 
  a.name as account, 
  t.amount, 
  t.status, 
  t.created_at
FROM admin_transfers t
JOIN users u ON t.user_id = u.id
JOIN accounts a ON t.account_id = a.id
ORDER BY t.created_at DESC;
```

### See notification logs
```sql
SELECT 
  type, 
  status, 
  count(*) as count
FROM notification_logs
GROUP BY type, status;
```

### See device registrations
```sql
SELECT 
  u.name, 
  d.device_name, 
  d.device_type, 
  d.is_active, 
  d.last_seen
FROM device_registrations d
JOIN users u ON d.user_id = u.id
ORDER BY d.last_seen DESC;
```

## Troubleshooting

### SMS Not Received
- Verify phone number format (need +1XXXXXXXXXX)
- Check notification_logs table for SMS status
- May be simulated in demo mode

### Push Notifications Not Received
- Verify device is registered: `device_registrations` table
- Confirm notification permission granted
- Check `notification_logs` table for delivery status
- Multiple devices registered? All should receive

### Transfer Not Appearing
- Check `accounts` table - balance should be updated
- Check `transactions` table - transaction should exist
- Check `audit_logs` for any errors

### OTP Not Received
- Check spam/junk folder
- Verify email address in user profile
- OTP expires after 15 minutes - request new one
- Check console for error messages

## Key Features Explained

### OTP Verification
- Two-step transfer process for security
- Admin must enter code from email to confirm
- Prevents accidental or unauthorized transfers

### Multi-Device Alerts
- When user registers on phone, tablet, and laptop
- Each device independently receives notification
- All notifications sent simultaneously
- User stays informed across all devices

### Real-Time Dashboard
- Dashboard auto-updates when new users sign up
- Transfer list updates as transfers complete
- Using Supabase real-time subscriptions
- No manual refresh needed

### Audit Trail
- Every admin action is logged
- Admin ID, action, timestamp recorded
- Track who sent what funds to whom
- Complete compliance trail

## Next Steps

1. **Test the flow** - Create users, send transfers
2. **Customize messages** - Edit alert messages in code
3. **Setup SMS service** - Replace simulated SMS with Twilio/AWS SNS
4. **Setup push service** - Replace with Firebase/APNs
5. **Add batch transfers** - Import CSV of users

## Common Customizations

### Change Transfer Amount Limits
Edit `/app/api/admin/transfers/route.ts`:
```typescript
if (amount > 10000) {
  return NextResponse.json({ error: 'Exceeds limit' })
}
```

### Change OTP Duration
Edit `/lib/auth/otp-service.ts`:
```typescript
const expiresAt = Date.now() + (30 * 60 * 1000) // 30 minutes
```

### Change Alert Messages
Edit `/lib/admin-transfer-alert-service.ts`:
```typescript
const message = `Custom message: $${amount} added`
```

### Add New Notification Channel
1. Create new function in alert service
2. Call it in `sendAdminTransferAlert()`
3. Add to results array

## Support

For issues or questions:
1. Check application logs in browser console
2. Query database to verify data
3. Check notification_logs for delivery status
4. Review ADMIN_TRANSFER_SYSTEM.md for detailed docs

Enjoy your admin transfer system!
