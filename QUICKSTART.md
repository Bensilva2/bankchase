# Quick Start Guide - Chase Banking App with Mailgun & SendGrid

Get the complete banking app running in 5 minutes with email notifications.

---

## 30-Second Setup

### 1. Clone & Install
```bash
cd /vercel/share/v0-project
npm install
```

### 2. Environment Variables
Create `.env.local` with:

**Option A: SendGrid (Recommended for Production)**
```bash
SENDGRID_API_KEY=SG_your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=sendgrid
STRIPE_SECRET_KEY=sk_test_your_key_here
```

**Option B: Mailgun (Great for Sandbox Testing)**
```bash
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=mailgun
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### 3. Run
```bash
npm run dev
```

### 4. Visit
- Dashboard: http://localhost:3000
- Send Money: http://localhost:3000/send-money
- Notifications: http://localhost:3000/notifications

---

## Test Payment Flow

### Quick Test with SendGrid
```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Alice Johnson",
    "senderEmail": "alice@example.com",
    "recipientName": "Bob Smith",
    "recipientEmail": "bob@example.com",
    "amount": 250.00,
    "currency": "USD",
    "description": "Payment for lunch"
  }'
```

### Response
```json
{
  "success": true,
  "transactionId": "pi_3Tq...",
  "message": "Payment processed successfully. Confirmation emails have been sent."
}
```

---

## Get API Keys

### SendGrid (5 minutes)
1. Go to https://sendgrid.com
2. Sign up (free account: 40 emails/month)
3. Create API Key in Settings > API Keys
4. Verify sender email/domain in Sender Authentication
5. Copy key to `.env.local`

### Mailgun (3 minutes)
1. Go to https://mailgun.com
2. Sign up (free account: 600 emails/month)
3. Go to Account > API Keys
4. Copy Private API Key
5. Get sandbox domain from Sending > Domains
6. Add your email to Authorized Recipients
7. Copy to `.env.local`

### Stripe (2 minutes)
1. Go to https://stripe.com
2. Create account
3. Get API key from Developers > API Keys
4. Use test key (starts with `sk_test_`)
5. Copy to `.env.local`

---

## File Structure

```
/vercel/share/v0-project/
├── app/
│   ├── api/
│   │   ├── payments/send/          # Payment processing
│   │   ├── notifications/          # Notification management
│   │   └── connectors/             # Webhook integration
│   ├── send-money/                 # Payment UI
│   ├── notifications/              # Notification center
│   └── page.tsx                    # Home page
├── components/
│   ├── p2p-payment.tsx             # Payment form
│   ├── notification-center.tsx     # Notifications UI
│   └── webhook-connectors.tsx      # Webhook config
├── lib/
│   ├── email-service.ts            # Service router
│   ├── mailgun-service.ts          # Mailgun integration
│   ├── payment-service.ts          # Payment logic
│   └── realtime.ts                 # Real-time updates
└── docs/
    ├── EMAIL_SERVICE_SETUP.md      # Detailed setup
    ├── MAILGUN_SENDGRID_IMPLEMENTATION.md
    └── COMPLETE_SYSTEM_OVERVIEW.md
```

---

## Key Features

✓ **P2P Payments** - Send money with Stripe
✓ **Email Notifications** - SendGrid or Mailgun
✓ **Real-Time Updates** - Live notification center
✓ **Webhook Connectors** - Slack, Discord, Teams, Email
✓ **Analytics** - Divvy and TikTok dashboards
✓ **Secure** - Server-side key management

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Check types
npm run type-check

# Format code
npm run format
```

---

## Switching Email Services

### SendGrid → Mailgun
```bash
# Update .env.local
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# Restart server
npm run dev
```

### Mailgun → SendGrid
```bash
# Update .env.local
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...

# Restart server
npm run dev
```

---

## Verify Installation

### Check Payment API
```bash
curl http://localhost:3000/api/payments/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"senderName":"Test","senderEmail":"test@test.com","recipientName":"Recipient","recipientEmail":"recipient@test.com","amount":100,"currency":"USD","description":"Test"}'
```

### Check Page Loads
```bash
curl http://localhost:3000/send-money | head -20
```

### Check Dev Logs
```bash
tail -f /tmp/dev.log
```

---

## Troubleshooting

### Issue: "EMAIL_SERVICE not configured"
**Solution:** Set `EMAIL_SERVICE=sendgrid` or `EMAIL_SERVICE=mailgun` in `.env.local`

### Issue: "Payment failed"
**Solution:** Check Stripe key is correct and starts with `sk_test_`

### Issue: "Emails not sending"
**Solution:** 
- Verify API key in dashboard
- Check sender email is verified
- Review dev logs: `tail -f /tmp/dev.log`

### Issue: Port 3000 already in use
**Solution:** 
```bash
lsof -i :3000
kill -9 <PID>
npm run dev
```

---

## Next Steps

1. **Configure Email Service** - Choose SendGrid or Mailgun
2. **Test Payment Flow** - Use the cURL examples
3. **Check Email Delivery** - Look at SendGrid/Mailgun dashboard
4. **Deploy to Vercel** - Push to GitHub and connect to Vercel
5. **Set Production Keys** - Add API keys to Vercel env vars
6. **Monitor Performance** - Check dashboards and logs

---

## Documentation

- **Detailed Setup:** See `/docs/EMAIL_SERVICE_SETUP.md`
- **Full Implementation:** See `/docs/MAILGUN_SENDGRID_IMPLEMENTATION.md`
- **System Overview:** See `/docs/COMPLETE_SYSTEM_OVERVIEW.md`

---

## Support

- Check `/docs` folder for detailed guides
- Review dev logs: `tail -f /tmp/dev.log`
- SendGrid docs: https://docs.sendgrid.com
- Mailgun docs: https://documentation.mailgun.com
- Stripe docs: https://stripe.com/docs

---

## Production Checklist

Before going live:
- [ ] Choose email service (SendGrid or Mailgun)
- [ ] Verify API credentials
- [ ] Configure production domain (email)
- [ ] Set up DNS records (SPF, DKIM)
- [ ] Test with real emails
- [ ] Deploy to Vercel
- [ ] Add production API keys
- [ ] Monitor delivery rates
- [ ] Set up error alerts

---

**You're ready! Your banking app with dual email service integration is live.**

Start with: `npm run dev`

Then visit: http://localhost:3000
