# Auth0 Integration Setup Guide

This document outlines how to configure Auth0 for BankChase with email OTP verification and Postgres user synchronization.

## Prerequisites

- Auth0 account ([https://auth0.com](https://auth0.com))
- Auth0 CLI (optional, for automation)
- Vercel project connected to your repository

## Step 1: Create Auth0 Tenant and Application

1. Log in to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new tenant or use existing one
3. Go to **Applications** → **Create Application**
4. Select **Regular Web Application**
5. Set Application Name: `BankChase`
6. Go to **Settings** tab

## Step 2: Configure Application

### Basic Settings
- **Application URI**: Your app URL (e.g., `http://localhost:3000`)
- **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`
- **Allowed Web Origins**: `http://localhost:3000`

### Environment Variables

Copy these values from Auth0 Settings tab:

```
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_MANAGEMENT_API_TOKEN=your_management_api_token_here
OTP_EXPIRY_MINUTES=10
```

To get the Management API token:
1. Go to **APIs** → **Management API**
2. Click **API Explorer** tab
3. Create a new **Machine-to-Machine Application**
4. Copy the access token from the Explorer

## Step 3: Enable Required Connections

1. Go to **Connections** → **Database**
2. Create or use existing Username-Password-Authentication
3. Enable email verification
4. Configure custom email templates if desired

## Step 4: Setup Webhooks (Optional but Recommended)

1. Go to **Logs** (if using Auth0 Dashboard)
2. Or configure via Management API to send events to:
   - `POST /api/webhooks/auth0`
   - Include `Authorization` header with webhook secret

## Step 5: Configure Email Provider

For OTP email sending, configure one of:

### Option A: Auth0 Email
1. Go to **Branding** → **Email Templates**
2. Use Auth0's built-in email provider

### Option B: SendGrid
1. Sign up for [SendGrid](https://sendgrid.com)
2. Add to your email configuration

### Option C: Resend
1. Sign up for [Resend](https://resend.com)
2. Add to `lib/otp-service.ts` sendOTPEmail method

## Step 6: Database Migration

Run the migration script to set up OTP and Auth0 columns:

```sql
-- Connect to your Supabase database
psql -h your-host -U postgres -d your-db < migrations/001_auth0_integration.sql
```

Or manually in Supabase SQL Editor:
- Copy contents of `migrations/001_auth0_integration.sql`
- Run in your Supabase project

## Step 7: Test Auth0 Integration

### Local Testing

1. Start your dev server: `npm run dev`
2. Navigate to login page
3. Click "Login with Auth0"
4. Verify callback to `/api/auth/callback`
5. User should be synced to Postgres

### OTP Verification Testing

1. Register with email and password
2. Check console logs for OTP code (in dev mode)
3. Enter OTP to verify email

## Step 8: Production Deployment

### Update Vercel Environment Variables

1. Go to Vercel Project Settings
2. Add environment variables:
   - `AUTH0_DOMAIN`
   - `AUTH0_CLIENT_ID`
   - `AUTH0_CLIENT_SECRET`
   - `AUTH0_MANAGEMENT_API_TOKEN`
   - `OTP_EXPIRY_MINUTES`
   - `AUTH0_WEBHOOK_SECRET` (for webhook verification)

### Update Auth0 URLs

1. Go to Auth0 Applications Settings
2. Update **Allowed Callback URLs**: `https://your-domain.com/api/auth/callback`
3. Update **Allowed Logout URLs**: `https://your-domain.com`
4. Update **Allowed Web Origins**: `https://your-domain.com`

## Security Checklist

- [ ] Enable Multi-Factor Authentication (MFA) in Auth0
- [ ] Setup webhook signature verification
- [ ] Use HTTPS for all URLs in production
- [ ] Enable Rate Limiting on OTP endpoint
- [ ] Rotate Auth0 credentials periodically
- [ ] Enable RLS policies in Supabase
- [ ] Use strong Session cookie configuration
- [ ] Add CSRF protection to sensitive routes
- [ ] Implement rate limiting on failed login attempts

## Troubleshooting

### Auth0 Login Redirects to /api/auth/callback but Nothing Happens
- Check Auth0 credentials are correct
- Verify callback URL matches in Auth0 settings
- Check browser console for errors

### OTP Email Not Sending
- Verify Email Provider is configured
- Check OTP service logs
- Ensure email address is valid

### Users Not Syncing to Postgres
- Check database migration was applied
- Verify Supabase credentials
- Check API logs for sync errors
- Manually trigger sync via webhook endpoint

### Session Not Persisting
- Ensure cookies are enabled
- Check `httpOnly`, `secure`, and `sameSite` settings
- Verify session cookie is being set

## Architecture

```
User Login → Auth0 → /api/auth/callback → Postgres Sync → Dashboard
                ↓
          /api/auth/login (OTP flow)
                ↓
          Database verification
```

## Files Modified

- `lib/auth0-config.ts` - Auth0 configuration
- `lib/auth0-context.tsx` - React context for auth state
- `lib/auth0-wrapper.ts` - Postgres sync logic
- `lib/otp-service.ts` - OTP generation and verification
- `lib/mcp-oauth-client.ts` - MCP token management
- `app/api/auth/` - Auth endpoints
- `migrations/001_auth0_integration.sql` - Database schema
- `app/layout.tsx` - Updated to use Auth0Provider

## Next Steps

1. Configure email provider for OTP emails
2. Setup MFA in Auth0
3. Implement Plaid integration for bank accounts
4. Add role-based access control (RBAC)
5. Setup audit logging for compliance
