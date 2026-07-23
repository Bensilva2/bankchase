# Email Service Setup Guide - SendGrid vs Mailgun

This guide explains how to configure either SendGrid or Mailgun for transaction notifications in the Chase Banking App.

## Overview

The application supports two email service providers:
- **SendGrid** - Enterprise email service with high reliability
- **Mailgun** - Developer-friendly transactional email service

Both services are fully integrated and can be switched via environment variables.

---

## Option 1: SendGrid Integration

### Setup Steps

#### Step 1: Create a SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up or log in to your account
3. Navigate to **Settings > API Keys**
4. Click **Create API Key**
5. Choose "Full Access" and create the key
6. Copy your API key (starts with `SG.`)

#### Step 2: Verify Your Sender Email
1. Go to **Settings > Sender Authentication**
2. Verify a domain or single sender email
3. This prevents your emails from going to spam

#### Step 3: Set Environment Variables
```bash
SENDGRID_API_KEY=SG_YOUR_API_KEY_HERE
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
EMAIL_SERVICE=sendgrid
```

#### Step 4: Test the Integration
```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "John Doe",
    "senderEmail": "john@example.com",
    "recipientName": "Jane Smith",
    "recipientEmail": "jane@example.com",
    "amount": 250.00,
    "currency": "USD",
    "description": "Test payment"
  }'
```

### SendGrid Features
- High deliverability rates
- Advanced analytics and reporting
- Excellent webhook support
- Large attachment support (up to 30MB)
- Cost-effective at scale

---

## Option 2: Mailgun Integration

### Setup Steps

#### Step 1: Create a Mailgun Account
1. Go to [Mailgun.com](https://mailgun.com)
2. Sign up or log in to your account
3. Navigate to **Account > API Keys**
4. Copy your Private API Key

#### Step 2: Get Your Domain
**For Testing (Sandbox):**
1. Go to **Sending > Domains**
2. Find your sandbox domain (format: `sandboxXXXXXXXX.mailgun.org`)
3. Add your verified email to **Authorized Recipients**

**For Production:**
1. Add your custom domain (e.g., `mg.yourdomain.com`)
2. Configure DNS records (SPF, DKIM, MX)
3. Wait for DNS propagation

#### Step 3: Set Environment Variables
```bash
MAILGUN_API_KEY=YOUR_API_KEY_HERE
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
FROM_EMAIL=noreply@yourcompany.com
EMAIL_SERVICE=mailgun
```

**Note for EU Customers:**
If your Mailgun account is in the EU region, add:
```bash
MAILGUN_API_ENDPOINT=https://api.eu.mailgun.net
```

#### Step 4: Test the Integration
```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Alice Johnson",
    "senderEmail": "alice@example.com",
    "recipientName": "Bob Smith",
    "recipientEmail": "bob@example.com",
    "amount": 500.00,
    "currency": "USD",
    "description": "Mailgun test"
  }'
```

### Mailgun Features
- Developer-friendly API
- Sandbox domains for testing
- Excellent documentation
- EU data center option
- Pay-as-you-go pricing
- Free tier available (600 emails/month)

---

## Switching Between Services

### Method 1: Environment Variable
Simply change the `EMAIL_SERVICE` variable:

```bash
# Use SendGrid
EMAIL_SERVICE=sendgrid

# Use Mailgun
EMAIL_SERVICE=mailgun
```

### Method 2: Automatic Detection
If only one service's credentials are configured, the system will automatically use it:
- If `SENDGRID_API_KEY` exists → Uses SendGrid
- If `MAILGUN_API_KEY` exists → Uses Mailgun
- Default fallback → Logs emails to console (development mode)

---

## Email Content Examples

### Transaction Notification (Recipient)
Both services send the same professional HTML email containing:
- Transaction confirmation
- Amount and currency
- Sender name and details
- Transaction ID for tracking
- Timestamp

Example email preview:
```
Subject: ⚡ Transaction Received: $500.00 USD

Hello Bob Chen,

You have received a transfer from Alice Johnson.

Transaction Details:
- Amount: $500.00 USD
- Description: Mailgun email service test
- Transaction ID: pi_3TqQO9AOkbLRKErd0SQZ5lSt
- Time: [Timestamp]

Thank you,
Chase Banking App
```

### Payment Confirmation (Sender)
```
Subject: ⚡ Payment Sent: $500.00 USD

Hello Alice Johnson,

Your payment has been successfully sent.

Transaction Details:
- Recipient: Bob Chen (bob@example.com)
- Amount: $500.00 USD
- Status: Processing
- Transaction ID: pi_3TqQO9AOkbLRKErd0SQZ5lSt

Thank you,
Chase Banking App
```

---

## Troubleshooting

### Emails Not Being Sent
1. **Check credentials**: Verify API keys are correct
2. **Check sender email**: Ensure sender domain is verified
3. **Check logs**: Run `tail -f /tmp/dev.log` to see errors
4. **Check recipient**: For Mailgun sandbox, ensure email is authorized

### Emails Going to Spam
**SendGrid:**
- Verify your sender domain
- Add SPF/DKIM records
- Use professional email addresses

**Mailgun:**
- For sandbox: Authorize recipient emails
- For production: Fully configure DNS records
- Monitor bounce rates

### API Errors
**SendGrid error: 401 Unauthorized**
- API key is invalid or expired
- Generate a new key in SendGrid dashboard

**Mailgun error: 401 Unauthorized**
- API key is incorrect
- Verify key from Account > API Keys

### Configuration Issues
If emails are being logged to console:
```
[v0] SendGrid not configured. Email would be sent to: jane@example.com
[v0] Mailgun not configured. Email would be sent to: jane@example.com
```

Solution: Set required environment variables and restart the dev server.

---

## API Response Format

All payment endpoints return consistent responses:

```json
{
  "success": true,
  "transactionId": "pi_3TqQO9AOkbLRKErd0SQZ5lSt",
  "message": "Payment processed successfully. Confirmation emails have been sent.",
  "paymentIntentId": "pi_3TqQO9AOkbLRKErd0SQZ5lSt",
  "status": "requires_payment_method"
}
```

---

## Service Comparison

| Feature | SendGrid | Mailgun |
|---------|----------|---------|
| API Setup | Easy | Easy |
| Deliverability | Excellent | Excellent |
| Sandbox/Testing | Limited | Sandbox domains |
| Cost | $25/month+ | $0.50 per 1k emails |
| Free Tier | 40 emails/month | 600 emails/month |
| EU Support | Yes | Yes (separate endpoint) |
| Webhook Support | Advanced | Good |
| Documentation | Comprehensive | Developer-friendly |

---

## Production Deployment

### SendGrid Production Checklist
- [ ] API key generated and stored securely
- [ ] Sender domain verified
- [ ] SPF/DKIM records configured
- [ ] Email templates tested
- [ ] Bounce handling configured
- [ ] Environment variable set: `EMAIL_SERVICE=sendgrid`

### Mailgun Production Checklist
- [ ] API key stored securely
- [ ] Custom domain added
- [ ] DNS records (SPF, DKIM, MX) configured
- [ ] Domain verified in Mailgun
- [ ] Email templates tested
- [ ] Authorized recipients configured
- [ ] Environment variable set: `EMAIL_SERVICE=mailgun`
- [ ] For EU: API endpoint URL set if needed

---

## Monitoring & Analytics

### SendGrid
- Dashboard: https://app.sendgrid.com/
- View: Open rates, click rates, bounces
- Real-time: Activity feed with all metrics

### Mailgun
- Dashboard: https://app.mailgun.com/
- View: Event logs, delivery status, bounce tracking
- Real-time: Events API for webhooks

---

## Support

For issues:
- **SendGrid Support**: https://support.sendgrid.com
- **Mailgun Support**: https://help.mailgun.com
- **App Logs**: `tail -f /tmp/dev.log`

---

## Implementation Code Reference

### Email Service Interface
```typescript
interface TransactionEmailData {
  recipientName: string
  recipientEmail: string
  senderName: string
  senderEmail: string
  amount: number
  currency: string
  description: string
  transactionId: string
  timestamp: Date
}

// Functions automatically route to configured service
export async function sendTransactionNotification(
  data: TransactionEmailData
): Promise<boolean>

export async function sendPaymentConfirmation(
  data: TransactionEmailData
): Promise<boolean>
```

### Configuration Detection
The application automatically detects which service to use based on:
1. `EMAIL_SERVICE` environment variable (priority 1)
2. Available API credentials (priority 2)
3. Console logging fallback (priority 3)

---

This setup allows you to easily switch between SendGrid and Mailgun or use both services simultaneously across different environments.
