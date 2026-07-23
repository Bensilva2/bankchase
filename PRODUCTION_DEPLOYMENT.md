# Production Deployment Guide - BankChase AI Suite

## Overview

Complete guide for deploying BankChase AI Suite to production with Neon, Resend, Upstash Workflow, and Better Auth.

## Prerequisites

- GitHub account with repository access
- Vercel account (production hosting)
- Neon PostgreSQL account
- Resend email service account
- Upstash QStash account
- Production domain name

## Frontend Deployment (Vercel)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: complete bankchase ai suite deployment"
git push origin main
```

### Step 2: Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
# Database
DATABASE_URL=postgresql://user:pass@host/database

# Authentication
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
BETTER_AUTH_URL=https://your-domain.com

# Email
RESEND_API_KEY=<your-resend-api-key>

# Workflows
QSTASH_TOKEN=<your-qstash-token>
QSTASH_CURRENT_SIGNING_KEY=<signing-key>
QSTASH_NEXT_SIGNING_KEY=<next-signing-key>

# Vercel
VERCEL_PROJECT_PRODUCTION_URL=https://your-domain.com
```

### Step 4: Enable Monitoring

- Enable Vercel Analytics for performance tracking
- Set up Web Vitals monitoring
- Configure error tracking

## Database Setup (Neon PostgreSQL)

### Step 1: Create Neon Project

1. Go to https://console.neon.tech
2. Create a new project
3. Select PostgreSQL version 15+
4. Copy the connection string
5. Set as `DATABASE_URL` in Vercel

### Step 2: Initialize Schema

Run this command after deploying to Vercel:

```bash
# Via Vercel deployment, the schema will auto-initialize
# Or manually verify schema exists:
npm run db:verify
```

### Step 3: Setup Backups

In Neon console:
- Enable automated backups: 7 days retention
- Set backup frequency: Daily
- Test restore procedure monthly

### Step 4: Configure Connection Pooling

In Neon dashboard:
- Enable Connection Pooling
- Mode: Transaction
- Pool size: 10-20
- Idle timeout: 5 minutes

## Email Setup (Resend)

### Step 1: Setup Resend Account

1. Sign up at https://resend.com
2. Generate API key in dashboard
3. Copy and set as `RESEND_API_KEY` in Vercel
4. Verify your sending domain

### Step 2: Configure Sending Domain

Add DNS records to your domain:

```
Type: TXT
Name: resend_verification_record
Value: <provided by Resend>
```

Verify in Resend dashboard and wait for propagation.

### Step 3: Test Email Sending

```bash
curl -X POST https://your-domain.com/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "onboarding",
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### Step 4: Monitor Deliverability

In Resend dashboard:
- Monitor delivery rate (target: >98%)
- Watch bounce rate (target: <0.5%)
- Review failed sends weekly

## Upstash Workflow Setup

### Step 1: Create QStash Project

1. Go to https://console.upstash.com
2. Create new QStash project
3. Copy API Token
4. Copy signing keys

### Step 2: Configure Environment Variables

Set in Vercel:

```
QSTASH_TOKEN=<your-token>
QSTASH_CURRENT_SIGNING_KEY=<current-key>
QSTASH_NEXT_SIGNING_KEY=<next-key>
```

### Step 3: Test Workflow Execution

```bash
# Trigger a test workflow
curl -X POST https://your-domain.com/api/onboarding/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>"
```

### Step 4: Monitor Workflow Runs

In QStash dashboard:
- Monitor execution success rate
- Set alerts for failures
- Review latency metrics
- Configure retry limits

## Security Configuration

### Step 1: HTTPS & SSL

- Vercel auto-manages SSL certificates
- All endpoints use HTTPS only
- Configured via automatic HSTS headers

### Step 2: Environment Variable Security

All sensitive keys stored in Vercel:
- `BETTER_AUTH_SECRET` (32+ chars)
- `RESEND_API_KEY`
- `QSTASH_TOKEN`
- `DATABASE_URL`

Never commit to Git. Use `.env.local` locally only.

### Step 3: Database Security

Neon provides:
- SSL connections by default
- IP whitelist (add Vercel IPs)
- Regular automated backups
- Point-in-time recovery

### Step 4: API Key Rotation

Schedule quarterly:
- Generate new `BETTER_AUTH_SECRET`
- Rotate `QSTASH_TOKEN`
- Update all Vercel env vars
- Monitor for errors

## Monitoring & Observability

### Step 1: Vercel Analytics

In Vercel dashboard:
- Real-time request monitoring
- Performance metrics
- Error tracking
- Deployment history

### Step 2: Database Monitoring

In Neon dashboard:
- Query performance metrics
- Connection pool status
- Storage usage
- Activity logs

### Step 3: Email Monitoring

In Resend dashboard:
- Delivery status (Sent/Bounce/Spam)
- Open rates
- Click rates
- Bounced email addresses

### Step 4: Workflow Monitoring

In QStash console:
- Request execution history
- Success/failure rates
- Execution duration
- Error messages and logs

### Step 5: Set Up Alerts

Configure notifications for:
- Application errors
- Database connection issues
- Failed email sends
- Workflow execution failures
- High response times (>1s)

## Scaling Considerations

### Frontend (Vercel)

- Auto-scales with Vercel Edge Network
- Global CDN for static assets
- Automatic image optimization
- Built-in auto-scaling by default

### Database (Neon)

- Auto-scales read replicas
- Monitor connection pool usage
- Configure optimal pool size: 10-20
- Monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Add indexes for frequently used columns
CREATE INDEX idx_workflow_run_user_id ON workflow_run(userId);
CREATE INDEX idx_email_log_status ON email_log(status);
```

### Email (Resend)

- Default: 1000 emails/minute
- Burst handling: Built-in
- Increase limits via support if needed
- Monitor sending queue

### Workflows (QStash)

- Auto-scales by default
- Monitor queue depth
- Adjust retry limits per workflow
- Increase timeout for long-running steps

## Health Checks

### Test All Systems

```bash
# Check frontend is live
curl https://your-domain.com

# Check API endpoints
curl https://your-domain.com/api/onboarding/status

# Check workflow endpoint
curl -X POST https://your-domain.com/api/workflow \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","userEmail":"test@example.com","userName":"Test"}'

# Check email API
curl -X POST https://your-domain.com/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"type":"test","email":"test@example.com","name":"Test"}'
```

### Verify Database Connection

```bash
# From Vercel deployment logs
# Should show successful database connection
```

### Test End-to-End Onboarding

1. Visit https://your-domain.com/onboarding
2. Complete all 8 steps
3. Click "Complete All & Start Workflow"
4. Check /admin/dashboard for workflow execution
5. Verify completion email was sent

## Rollback Procedure

### Frontend Rollback (Vercel)

If issues occur after deployment:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Changes take effect immediately
5. Monitor logs for issues

### Database Rollback (Neon)

If schema changes cause issues:

1. Go to Neon dashboard
2. Find backup from before changes
3. Click "Restore Point"
4. Verify data integrity
5. Redeploy application

### Email/Workflow Configuration

If API keys are compromised:

1. Generate new RESEND_API_KEY in Resend
2. Generate new QSTASH_TOKEN in Upstash
3. Update Vercel environment variables
4. Redeploy application
5. Verify endpoints are working

### Emergency Procedure

If critical issues:

```bash
# 1. Rollback to previous Vercel deployment
# 2. Restore database from backup (Neon)
# 3. Verify all endpoints responding
# 4. Check logs for root cause
# 5. Fix code locally
# 6. Test in staging
# 7. Redeploy to production
```

## Performance Optimization

### Frontend (Next.js)

- Image optimization: Automatic in Vercel
- Code splitting: Next.js built-in
- SWR caching: Enabled with stale-while-revalidate
- GZIP compression: Automatic by Vercel

### Database (Neon)

- Connection pooling: Enable in Neon settings
- Query optimization: Monitor in Neon console
- Index optimization: Add indexes for frequent queries
- Caching: Consider Redis for frequently accessed data

### Email (Resend)

- Batch sending: Queue emails if > 100/min
- Rate limiting: Monitor to avoid throttling
- Template caching: Store HTML templates locally

### Workflows (QStash)

- Retry strategy: Configure per workflow type
- Timeout settings: Increase for long-running steps
- Parallelization: Run independent steps concurrently

## Security Checklist

Before going live:

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] BETTER_AUTH_SECRET set (32+ chars)
- [ ] All API keys in Vercel env vars (never in Git)
- [ ] Database SSL connections enabled
- [ ] Resend domain verified with DNS
- [ ] QStash signing keys configured
- [ ] Email templates reviewed
- [ ] Database backups enabled
- [ ] Monitoring and alerts configured
- [ ] Incident response plan documented

## Maintenance Tasks

### Daily

- Monitor error rates in Vercel
- Check workflow execution success rate
- Review email delivery status

### Weekly

- Review performance metrics
- Check database connection pool health
- Monitor costs across services

### Monthly

- Update dependencies for security patches
- Review and optimize slow queries
- Test backup restoration
- Audit access logs

### Quarterly

- Full security audit
- Performance benchmarking
- Capacity planning review
- Disaster recovery drill
- Rotate BETTER_AUTH_SECRET

## Support & Resources

**Documentation:**
- Neon: https://neon.tech/docs
- Resend: https://resend.com/docs
- Upstash: https://upstash.com/docs
- Better Auth: https://www.better-auth.com/docs
- Vercel: https://vercel.com/docs

**Dashboards:**
- Vercel: https://vercel.com/dashboard
- Neon: https://console.neon.tech
- Resend: https://app.resend.com
- Upstash: https://console.upstash.com

**Support Contacts:**
- Vercel: support@vercel.com
- Neon: support@neon.tech
- Resend: support@resend.com
- Upstash: support@upstash.com

---

**Deployment Completed:** [Insert Date]
**BankChase AI Suite v1.0**
**Next Review:** [Insert Date + 1 month]
