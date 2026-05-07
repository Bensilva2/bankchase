# Demo Money Transfer System - Setup Checklist

Follow these steps to get the demo money transfer system up and running.

## Prerequisites
- ✅ Next.js 16+ app with Supabase integration
- ✅ Admin role already implemented in your system
- ✅ Access to Supabase SQL Editor
- ✅ Vercel project connected to GitHub

---

## Step 1: Database Schema Setup (5 minutes)

### 1.1 Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor"
3. Click "+ New Query"

### 1.2 Create Tables
1. Copy the contents of `/lib/migrations/002_create_demo_transfers.sql`
2. Paste into the SQL Editor
3. Click "Run"
4. You should see 3 tables created:
   - `demo_accounts`
   - `demo_transfers`
   - `demo_transfer_audit`

### 1.3 Verify Tables
Run this query to verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'demo%';
```

You should see 3 rows.

**Status: ✅ Database Ready**

---

## Step 2: Environment Variables (3 minutes)

### 2.1 Generate CRON_SECRET
Create a secure random token:
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid))
```

Save this value somewhere safe - you'll need it.

### 2.2 Add to Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Name: `CRON_SECRET`
4. Value: (paste the token from step 2.1)
5. Select: Production, Preview, Development
6. Click "Save"

### 2.3 Redeploy
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete

**Status: ✅ Environment Ready**

---

## Step 3: Code Deployment (2 minutes)

All code is already in place:
- ✅ `/lib/demo-transfer-service.ts` - Core logic
- ✅ `/app/api/admin/demo-transfer/` - API endpoints
- ✅ `/app/admin/demo-money/page.tsx` - Admin page
- ✅ `/components/demo-money-transfer.tsx` - Transfer form
- ✅ `/components/pending-demo-funds.tsx` - User alert
- ✅ `/vercel.json` - Cron configuration (updated)

### 3.1 Push to GitHub
```bash
git add .
git commit -m "Setup demo money transfer system"
git push origin main
```

Wait for Vercel to auto-deploy.

### 3.2 Verify Deployment
1. Go to Vercel Deployments
2. Check that latest deployment is "Ready"
3. Open your app to verify no errors

**Status: ✅ Code Deployed**

---

## Step 4: Test the System (5 minutes)

### 4.1 Access Admin Page
1. Log in as an admin user
2. Go to `/admin/demo-money`
3. You should see the admin dashboard with stats

### 4.2 Send a Test Transfer
1. Click "Send to Account" tab
2. Enter account number: `TEST-DEMO-001`
3. Enter amount: `100.00`
4. Select 7 days refund period
5. Click "Send Demo Money"
6. You should see a success message

### 4.3 Verify Transfer
1. Go to user dashboard
2. Look for the "Pending Demo Funds" alert
3. Should show $100.00 with countdown

### 4.4 Test Cron Job (Manual)
```bash
curl -X POST https://your-domain.com/api/admin/demo-transfer/process-refunds \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -H "Content-Type: application/json"
```

You should get: `{"success": true, "message": "Refund processing completed"}`

**Status: ✅ Tests Passed**

---

## Step 5: Verify Cron Job Scheduling (2 minutes)

### 5.1 Check Cron Configuration
1. Go to Vercel Dashboard → Settings → Cron Jobs
2. You should see one scheduled job:
   - Path: `/api/admin/demo-transfer/process-refunds`
   - Schedule: `0 2 * * *` (Daily at 2 AM UTC)
   - Status: Active

### 5.2 Check Logs (After 24 hours)
1. Go to Vercel Deployments
2. Click on latest deployment
3. Click "Logs"
4. Filter for "cron" or "demo-transfer"
5. You should see execution logs

**Status: ✅ Cron Job Active**

---

## Step 6: Integration with Existing Features (10 minutes)

### 6.1 Dashboard Integration (Already Done)
The pending demo funds alert is already integrated into `/app/dashboard/page.tsx`:
- Imported `PendingDemoFunds` component
- Displays automatically if user has pending funds

### 6.2 Admin Integration (Already Done)
The demo money admin page is already at `/admin/demo-money`

### 6.3 Custom Integration (Optional)
To add demo transfer components to your custom pages:

```typescript
import { DemoMoneyTransfer } from '@/components/demo-money-transfer'
import { PendingDemoFunds } from '@/components/pending-demo-funds'
import { useDemoTransfers } from '@/hooks/useDemoTransfers'

// Admin page
export default function MyAdminPage() {
  return <DemoMoneyTransfer />
}

// User dashboard
export default function MyDashboard() {
  const { pendingTransfers, getTotalPending } = useDemoTransfers()
  
  return (
    <>
      <PendingDemoFunds />
      <p>Total pending: ${getTotalPending()}</p>
    </>
  )
}
```

**Status: ✅ Integration Complete**

---

## Step 7: Documentation & Training (5 minutes)

### 7.1 Share with Team
- Share `DEMO_MONEY_GUIDE.md` with your team
- Walkthrough the admin page features
- Explain the pending funds workflow

### 7.2 Set Policies
Decide:
- Who can send demo money? (All admins or only super admins?)
- Default refund period (7 or 14 days)?
- Common demo amounts? ($50, $100, $500?)
- Use cases? (Onboarding, testing, demos?)

### 7.3 Create Admin Guidelines
Document:
- When to use demo money
- How much to give new users
- How to handle disputes
- Audit trail review process

**Status: ✅ Team Ready**

---

## Troubleshooting

### Issue: "Unauthorized" error when sending transfer
**Solution:** 
- Verify user account has admin role in database
- Check Supabase profiles table

### Issue: Cron job not running
**Solution:**
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel cron jobs settings
- Manually trigger endpoint to test

### Issue: Pending funds not showing in dashboard
**Solution:**
- Verify transfer status is 'pending' in database
- Check that expires_at is in the future
- Verify user account_number matches transfer's to_account_number
- Clear browser cache and reload

### Issue: Balance not updating after transfer
**Solution:**
- Check Supabase RLS policies allow account updates
- Verify admin has sufficient demo balance
- Check browser console for API errors
- Try transaction in Supabase SQL Editor

---

## What's Next?

After setup is complete:

1. **Create Bulk Transfer Campaign** - Send demo money to all onboarded users
2. **Set Spending Limits** - Add spending caps on demo funds
3. **Analytics** - Track how users spend demo money
4. **Integration** - Connect with real banking features
5. **Automation** - Send demo money automatically on signup

---

## Support & Questions

Refer to `DEMO_MONEY_GUIDE.md` for:
- API endpoint documentation
- Component usage examples
- Advanced features
- Best practices

Check `DEMO_MONEY_GUIDE.md` under:
- "Troubleshooting" section for common issues
- "API Endpoints" for endpoint details
- "Integration Notes" for custom implementations

---

## Success Criteria ✅

You have successfully set up demo money when:

- [ ] Database tables created in Supabase
- [ ] `CRON_SECRET` set in Vercel environment variables
- [ ] Code deployed and no errors
- [ ] Can access `/admin/demo-money` page
- [ ] Can send test transfer successfully
- [ ] Pending funds show in user dashboard
- [ ] Manual cron trigger works
- [ ] Cron job scheduled in Vercel
- [ ] Team trained and ready to use

**You're all set! 🎉**
