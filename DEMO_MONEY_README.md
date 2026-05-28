# Demo Money Transfer System

Complete virtual fund management system for your Chase-style banking application. Perfect for testing, onboarding, and demos.

## 🚀 Quick Start

1. **Setup** (10 minutes)
   - Run database migration in Supabase
   - Set `CRON_SECRET` in Vercel environment variables
   - Deploy code

2. **Test** (5 minutes)
   - Go to `/admin/demo-money`
   - Send a test transfer
   - Verify balance update

3. **Use** (Ongoing)
   - Send demo money to new users
   - Track pending transfers
   - Monitor refunds

## 📋 Documentation

### Getting Started
- **[SETUP_DEMO_MONEY.md](./SETUP_DEMO_MONEY.md)** - Step-by-step setup checklist
- **[DEMO_MONEY_GUIDE.md](./DEMO_MONEY_GUIDE.md)** - Complete feature guide
- **[DEMO_MONEY_IMPLEMENTATION.md](./DEMO_MONEY_IMPLEMENTATION.md)** - Technical implementation details

## ✨ Features

### Admin Features
- ✅ Send demo money to registered users (instant credit)
- ✅ Send to external accounts (pending with auto-refund)
- ✅ Bulk transfer to all organization users
- ✅ View transfer history and statistics
- ✅ Automatic refund processing (daily)
- ✅ Full audit trail

### User Features
- ✅ See demo balance instantly
- ✅ View pending funds with countdown
- ✅ Spend demo money in your app
- ✅ Automatic refunds after period expires

## 🏗️ Architecture

```
Admin Dashboard (/admin/demo-money)
    ↓
DemoMoneyTransfer Component
    ↓
API Routes (/api/admin/demo-transfer/*)
    ↓
Demo Transfer Service
    ↓
Supabase Database
    ↓
User Dashboard (/dashboard) - Shows Pending Funds
```

## 📁 File Structure

```
lib/
├── demo-transfer-service.ts           # Core business logic
└── migrations/
    └── 002_create_demo_transfers.sql  # Database schema

app/api/admin/demo-transfer/
├── single/route.ts                    # Send to one account
├── bulk/route.ts                      # Send to all users
└── process-refunds/route.ts           # Auto-refund processor (cron)

app/admin/
└── demo-money/page.tsx                # Admin dashboard

app/dashboard/
└── page.tsx                           # User dashboard (integrated)

components/
├── demo-money-transfer.tsx            # Transfer form
└── pending-demo-funds.tsx             # Pending funds alert

hooks/
└── useDemoTransfers.ts                # React hook

vercel.json                            # Cron configuration
```

## 🔧 Configuration

### Environment Variables
```env
CRON_SECRET=your-secure-random-token
```

### Cron Job
Runs daily at 2 AM UTC to process refunds:
```json
{
  "crons": [{
    "path": "/api/admin/demo-transfer/process-refunds",
    "schedule": "0 2 * * *"
  }]
}
```

## 📊 Database Schema

### demo_accounts
- Stores virtual accounts (one per user + admin)
- Tracks demo balance separately
- `is_demo_account` flag for identification

### demo_transfers
- Records all transfers (single or bulk)
- Tracks status: pending → completed → refunded
- Auto-refund date for external transfers
- Audit trail for compliance

### demo_transfer_audit
- Complete history of all changes
- Who initiated, when, and what changed
- Compliance-ready logging

## 🔐 Security

- **Role-based access** - Only admins can send
- **Balance validation** - Prevents overdrafts
- **CRON protection** - Refund job authenticated
- **Audit trail** - Complete transaction history
- **Data integrity** - Foreign keys and constraints

## 📖 Usage Examples

### Send Demo Money (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/demo-transfer/single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "to_account_number": "ACC-12345678",
    "amount": 100.00,
    "days_to_refund": 7,
    "notes": "Welcome bonus"
  }'
```

### Send to All Users (Super Admin)
```bash
curl -X POST http://localhost:3000/api/admin/demo-transfer/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "amount": 50.00,
    "days_to_refund": 7
  }'
```

### Process Refunds (Cron Job)
```bash
curl -X POST http://localhost:3000/api/admin/demo-transfer/process-refunds \
  -H "Authorization: Bearer CRON_SECRET"
```

## 🧪 Testing Workflow

1. **Setup** - Complete database migration and env vars
2. **Admin Test** - Go to `/admin/demo-money`, send $100 to test account
3. **Verify Instant** - Check account balance updates immediately
4. **Verify Pending** - Send to external account, see "Pending" alert
5. **Test Cron** - Manually trigger refund endpoint
6. **Verify Refund** - Confirm transfer marked as refunded, balances updated

## 🐛 Troubleshooting

### Issue: "Unauthorized" error
- Verify user has admin role
- Check Supabase auth configuration

### Issue: Cron job not running
- Verify CRON_SECRET is set in Vercel
- Check Vercel cron logs
- Manually test endpoint

### Issue: Balance not updating
- Clear browser cache
- Check RLS policies in Supabase
- Verify admin account exists

See [DEMO_MONEY_GUIDE.md](./DEMO_MONEY_GUIDE.md) for more troubleshooting.

## 🎯 Use Cases

1. **Onboarding** - Give new users demo money to test features
2. **Testing** - Send money to test accounts during QA
3. **Demos** - Provide funds for live demonstrations
4. **Campaigns** - Bulk send for marketing campaigns
5. **Training** - Demo accounts for team training

## 📈 Next Steps

- Monitor transfer history for usage patterns
- Analyze which features users test with demo money
- Integrate real transfer endpoints
- Add spending limits or caps
- Create automated campaigns
- Add email notifications

## 🤝 Integration

The system integrates seamlessly with:
- User authentication
- Account management
- Transaction history
- Balance display
- Audit logging

## 📞 Support

For issues:
1. Check [DEMO_MONEY_GUIDE.md](./DEMO_MONEY_GUIDE.md) troubleshooting
2. Review [DEMO_MONEY_IMPLEMENTATION.md](./DEMO_MONEY_IMPLEMENTATION.md) technical details
3. Check Supabase/Vercel logs
4. Verify environment variables

## 📝 Implementation Checklist

- ✅ Database schema created
- ✅ API endpoints implemented
- ✅ Admin dashboard created
- ✅ User components integrated
- ✅ React hooks created
- ✅ Cron job configured
- ✅ Audit trail enabled
- ✅ Documentation complete
- ⬜ Deployed to production
- ⬜ Team trained
- ⬜ First transfer sent

## 📄 License

Part of your banking application project.

---

**Status: Production Ready** ✅

See [SETUP_DEMO_MONEY.md](./SETUP_DEMO_MONEY.md) to get started.
