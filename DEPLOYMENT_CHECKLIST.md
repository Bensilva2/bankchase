# BankChase Deployment Checklist

Complete this checklist before deploying to production.

## 🔐 Supabase Configuration

### Redirect URLs
- [ ] Log into [Supabase Dashboard](https://app.supabase.com)
- [ ] Go to **Authentication** → **URL Configuration**
- [ ] Set **Site URL** to: `https://demo-nextjs-with-supabase.vercel.app`
- [ ] Add to **Redirect URLs**:
  - [ ] `http://localhost:3000/**` (local development)
  - [ ] `https://demo-nextjs-with-supabase.vercel.app/**` (production)
  - [ ] `https://*-<your-team-slug>.vercel.app/**` (Vercel previews)
- [ ] Click **Save**

### Email Templates (if using email authentication)
- [ ] Update **Auth** → **Email Templates** 
- [ ] In Confirmation Email template: Change `{{ .SiteURL }}` to `{{ .RedirectTo }}`
- [ ] In Password Reset template: Change `{{ .SiteURL }}` to `{{ .RedirectTo }}`
- [ ] Click **Save** for each template

### RBAC Database
- [ ] Run migration: Copy content of `migrations/003-rbac-and-auth.sql` 
- [ ] Paste into Supabase **SQL Editor**
- [ ] Execute the SQL
- [ ] Verify tables created in **Table Editor**:
  - [ ] `users`
  - [ ] `accounts`
  - [ ] `two_factor_codes`
  - [ ] `password_resets`
  - [ ] `admin_audit_logs`
  - [ ] `login_history`

## 🚀 Vercel Deployment

### Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **demo-nextjs-with-supabase**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
NEXT_PUBLIC_SITE_URL = https://demo-nextjs-with-supabase.vercel.app
JWT_SECRET = <generate: openssl rand -base64 32>
```

**Getting Values:**
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Find in Supabase **Settings** → **API**
- `JWT_SECRET`: Generate with `openssl rand -base64 32` (run locally)

### Deployment
- [ ] Push code to GitHub
- [ ] Vercel auto-deploys (watch dashboard)
- [ ] Deployment completes successfully
- [ ] No build errors in **Deployments** tab

## ✅ Testing

### Local Development
- [ ] Clone repo: `git clone <repo>`
- [ ] Install dependencies: `pnpm install`
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase credentials
- [ ] Run dev server: `pnpm dev`
- [ ] Go to `http://localhost:3000`
- [ ] Test signup/login flow

### Sign Up Flow
- [ ] Click "Sign Up"
- [ ] Enter email and password
- [ ] Submit form
- [ ] Check email for confirmation link (if enabled)
- [ ] Confirm email (or auto-confirm in development)
- [ ] Should be redirected to dashboard

### Login Flow (2FA)
- [ ] Click "Sign In"
- [ ] Enter email and password
- [ ] Should see "Enter verification code" screen
- [ ] Check email/SMS for 6-digit code
- [ ] Enter code
- [ ] Should be logged in and redirected to dashboard

### Password Reset
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Should see "Check your email"
- [ ] Find reset email with link
- [ ] Click reset link
- [ ] Enter new password
- [ ] Should redirect to login
- [ ] Try logging in with new password

### Admin Features
- [ ] Create test user account
- [ ] As admin, go to `/admin` dashboard
- [ ] View users list
- [ ] View audit logs (all admin actions should be logged)
- [ ] Try updating a user's role
- [ ] Check audit logs for the action

### RBAC Enforcement
- [ ] Create regular user account (gets "customer" role)
- [ ] As customer, try accessing `/admin` → should redirect to `/dashboard`
- [ ] Customer can only see their own profile/balance
- [ ] Admin can see all users and view/change their roles

## 🌐 Production Testing

### Test Redirect URLs Work
- [ ] Go to `https://demo-nextjs-with-supabase.vercel.app`
- [ ] Test signup (should receive confirmation email)
- [ ] Test login with 2FA (should receive code via SMS/email)
- [ ] Test password reset (should work end-to-end)
- [ ] Test OAuth (if configured)

### Test Domain Redirect
- [ ] Visit production URL
- [ ] Signup and confirm email
- [ ] Should be redirected back to app (not error)
- [ ] Session should persist across page reloads

### Monitor Errors
- [ ] Check Vercel **Functions** logs for errors
- [ ] Check Vercel **Runtime Logs** 
- [ ] Check browser console for JavaScript errors
- [ ] Check Supabase **Logs** for SQL errors

## 📊 Verification

### Database Verification
- [ ] In Supabase SQL Editor, run:
  ```sql
  SELECT COUNT(*) as user_count FROM users;
  SELECT COUNT(*) as account_count FROM accounts;
  SELECT COUNT(*) as audit_log_count FROM admin_audit_logs;
  ```
- [ ] New test user should be in `users` table with role `customer`
- [ ] User should have account in `accounts` table with `0.00` balance
- [ ] Admin actions should be in `admin_audit_logs`

### Security Verification
- [ ] In database, check password_hash is not plaintext
- [ ] JWT tokens are signed and not readable without secret
- [ ] 2FA codes are single-use and expire after 5 minutes
- [ ] Audit logs cannot be modified (immutable)

## 🔄 Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry, DataDog, etc.)
- [ ] Set up uptime monitoring
- [ ] Set up email alerts for errors
- [ ] Monitor auth success/failure rates

### Documentation
- [ ] Share deployment guide with team
- [ ] Update README with deployment instructions
- [ ] Document admin procedures
- [ ] Create runbook for common issues

### Cleanup
- [ ] Remove test accounts if needed
- [ ] Verify demo data is cleared
- [ ] Check for any hardcoded secrets in code
- [ ] Review `.env` files are not committed

## 🆘 Troubleshooting

If you encounter issues:

1. **"Redirect URL doesn't match"**
   - Check Supabase redirect URLs list
   - Verify SITE_URL is correct
   - Use wildcard pattern if needed

2. **"Email confirmation not working"**
   - Check email templates use `{{ .RedirectTo }}`
   - Verify email service is enabled in Supabase
   - Check spam folder

3. **"2FA code not received"**
   - Verify SMS/email provider is configured
   - Check user's phone number/email is correct
   - Check code expiration (5 minutes)

4. **"Admin dashboard not accessible"**
   - Check user role is "admin" in database
   - Verify JWT token contains correct role
   - Check middleware is allowing access

See `docs/SUPABASE_REDIRECT_SETUP.md` for detailed troubleshooting.

---

**Status**: Ready for deployment!
**Last Updated**: 2024
**Maintainer**: Your Team
