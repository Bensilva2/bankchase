# Demo Money Transfer System - User Guide

## Overview

The Demo Money Transfer System allows administrators to send simulated demo money to users for testing and demonstration purposes. This guide explains how the system works from both user and admin perspectives.

## For Users

### Receiving Demo Money

Demo money can be sent to your account in two ways:

#### 1. Instant Transfers (Internal)
- **What happens:** Money is instantly credited to your account
- **Status:** "Received" (completed)
- **Duration:** Permanent
- **Use case:** Admins send to registered users on the platform

#### 2. Pending Transfers (External)
- **What happens:** Money shows as "Pending" with countdown
- **Status:** "Pending" → "Refunded" after 7-14 days
- **Duration:** 7 or 14 days (configurable)
- **Use case:** Admins send to external account numbers for testing cross-bank transfers
- **Automatic refund:** System automatically refunds money after the specified period

### Accessing Your Demo Transfers

1. **Navigate to Demo Transfers Page**
   - Click "Demo Transfers" in the navigation menu
   - Or visit `/demo-transfers`

2. **View Your Transfers**
   - See all received demo money transfers
   - Filter by status: All / Pending / Completed
   - Track pending transfers with countdown timers

### Transfer Details

Each transfer shows:
- **Reference Number:** Unique ID (format: `DEMO-XXXXXXXX`)
- **Amount:** How much demo money you received
- **Status:** Received, Pending, or Refunded
- **Transfer Date:** When you received the demo money
- **Days Until Refund:** For pending transfers only

### Notifications

When you receive demo money:
- A notification banner appears on your dashboard
- Shows latest transfer amount
- Quick link to view all transfers
- Dismiss option to clear the notification

### FAQ - Users

**Q: What can I do with demo money?**
A: Demo money is meant for testing and demonstration. You can use it to practice with the banking features, but it's not real money and cannot be withdrawn.

**Q: Will my demo money be taken away?**
A: Pending transfers (marked with countdown) will be automatically refunded after the specified period (7 or 14 days). Completed transfers are permanent for testing purposes.

**Q: Can I transfer demo money to someone else?**
A: No, demo money transfers are one-way from admins to users. You cannot send it to other users or external accounts.

**Q: How do I know when demo money expires?**
A: Pending transfers show a countdown timer. You'll receive notifications before refunds occur.

---

## For Admins

### Accessing Admin Controls

1. **Navigate to Admin Dashboard**
   - Click "Admin" in the navigation menu
   - Go to "Demo Money Transfer" tab

2. **Three Main Functions:**
   - Single Transfer
   - Bulk Transfer
   - Transfer History

### Single Transfer

**Send demo money to one specific account**

**Steps:**
1. Enter recipient's account number
2. Enter amount to send
3. Select refund period (7 or 14 days)
4. Click "Send Demo Money"

**Behavior:**
- If recipient is registered user → Instant credit (completed)
- If recipient is external account → Pending status with auto-refund
- Reference number generated automatically

**Example:**
```
Account: 1234567890
Amount: $5,000
Days to Refund: 14
Result: Transfer DEMO-ABC12345 sent
```

### Bulk Transfer

**Send same amount to all registered users at once**

**Steps:**
1. Enter amount per user
2. Select refund period (7 or 14 days)
3. Click "Send to All Users"

**Behavior:**
- Each user receives the same amount
- All transfers are instant (internal)
- All users get notifications
- Perfect for testing with user population

**Example:**
```
Amount Per User: $1,000
Recipients: 25 registered users
Total Sent: $25,000
All transfers marked as "Completed"
```

### Transfer History

**View and track all demo money transfers**

**Information shown:**
- Transfer reference number
- Recipient account
- Amount sent
- Transfer status (Completed / Pending / Refunded)
- Transfer type (Internal / External)
- Date sent

**Filtering:**
- View all transfers
- Search by reference number
- Filter by status
- Sort by date

**Monitor:**
- Track admin balance
- See pending refunds count
- Total amount sent tracking

### API Endpoints (Admin)

```
POST /api/admin/demo-transfer
Send to single account

POST /api/admin/demo-transfer/bulk
Send to all registered users

GET /api/admin/demo-transfer/history
Get transfer history with filters

POST /api/admin/demo-transfer/process-refunds
Process pending refunds (scheduled daily)
```

### Scheduled Refund Process

**Automatic Daily Refund Job**

The system includes a scheduled Cron job that:
1. Runs daily at a configured time
2. Finds all pending transfers past their refund date
3. Automatically refunds money back to admin account
4. Updates transfer status to "Refunded"
5. Logs all refund operations

**Setup in Vercel:**
```
# vercel.json
{
  "crons": [{
    "path": "/api/admin/demo-transfer/process-refunds",
    "schedule": "0 0 * * *"  // Daily at midnight UTC
  }]
}
```

**Manual Trigger:**
```
curl -X POST https://yourapp.com/api/admin/demo-transfer/process-refunds \
  -H "Authorization: Bearer YOUR_CRON_TOKEN"
```

### Admin Dashboard Metrics

**Displayed Stats:**
- **Admin Balance:** Current available demo money
- **Total Sent:** Sum of all non-refunded transfers
- **Pending Refunds:** Count of pending transfers
- **Completed Transfers:** Count of instant credits

**Color Coding:**
- Green: Completed/Received
- Yellow: Pending (countdown)
- Gray: Refunded

### Admin FAQ

**Q: How much demo money do I start with?**
A: Default admin balance is $1,000,000. This can be configured in the system.

**Q: What happens if I run out of demo money?**
A: The system prevents sending more than available balance. Refunds add back to your balance.

**Q: Can users request demo money?**
A: No, only admins can initiate transfers. Users can only receive what's sent to them.

**Q: How do I track pending refunds?**
A: The dashboard shows pending refund count. History page shows individual refund dates.

**Q: Can I cancel a pending transfer before refund?**
A: Currently no, but this can be added as a feature. Refunds happen automatically.

**Q: What if the refund job fails?**
A: Check logs and manually trigger via API. Failed refunds don't mark transfers as refunded.

---

## Database Schema

### demo_accounts Table
```sql
CREATE TABLE demo_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  account_number VARCHAR(20) UNIQUE,
  account_type VARCHAR(20),
  balance DECIMAL(15, 2),
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### demo_transfers Table
```sql
CREATE TABLE demo_transfers (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  to_account_number VARCHAR(20),
  amount DECIMAL(15, 2),
  currency VARCHAR(3),
  status VARCHAR(20),
  transfer_type VARCHAR(20),
  transfer_reference VARCHAR(50) UNIQUE,
  days_until_refund INT,
  refund_date TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_transfer_reference (transfer_reference),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

## Security Considerations

**Authentication:**
- All transfers require admin role verification
- API endpoints check admin privileges
- User access limited to own transfers

**Validation:**
- Amount validation (positive, non-zero)
- Account number format validation
- Duplicate transfer prevention
- Balance checks before sending

**Audit Trail:**
- All transfers logged with admin ID
- Timestamps for all operations
- Reference numbers for tracking
- Status change history

**Encryption:**
- Database encryption at rest
- HTTPS for all transfers
- RLS policies for data access
- Bearer token for Cron jobs

## Monitoring & Analytics

**Metrics to Track:**
- Daily transfer volume
- Average transfer amount
- Pending refund amounts
- Failed transfer rate
- System balance health

**Alerts:**
- Large transfer notifications
- Low balance warnings
- Refund processing failures
- API error rate spikes

## Troubleshooting

### User Cannot See Transfers
- Check user authentication
- Verify database connection
- Check API response in browser console
- Review server logs for errors

### Pending Refunds Not Processing
- Verify Cron job is enabled
- Check server logs for job execution
- Manually trigger refund endpoint
- Verify admin account has balance

### Transfer Shows as Failed
- Check account number validity
- Verify admin has sufficient balance
- Review error message in admin dashboard
- Check API logs for detailed errors

### Balance Discrepancies
- Verify refund job ran successfully
- Check for failed transfers
- Review transaction logs
- Contact system administrator

---

## Future Enhancements

**Planned Features:**
- Cancel pending transfers
- Recurring demo money transfers
- Transfer limits per user
- Scheduled transfers (send at specific time)
- Email notifications for refunds
- Advanced analytics dashboard
- CSV export of transfer history
- Rate limiting per admin
- Multi-currency support
- Transaction reversal capability

**Roadmap:**
- Q2 2024: Cancel transfers feature
- Q2 2024: Email notifications
- Q3 2024: Advanced analytics
- Q3 2024: Scheduled transfers
- Q4 2024: Multi-currency

---

## Support & Contact

For questions or issues:
- Email: support@mybank.example.com
- Documentation: Check README and API docs
- Report bugs: GitHub Issues
- Feature requests: Feature board

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
