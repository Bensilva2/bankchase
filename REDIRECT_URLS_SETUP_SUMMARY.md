# Redirect URLs Setup - Quick Reference

Your BankChase app is now configured for Supabase authentication with proper redirect URL handling for local development, Vercel previews, and production deployments.

## What Was Set Up

✅ **Dynamic URL Helper** (`lib/url-helpers.ts`)
- Automatically detects environment (local, Vercel preview, or production)
- Provides `getURL()` function for use in authentication flows
- No manual URL configuration needed per environment

✅ **Environment Configuration** (`.env.example` updated)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public authentication key
- `NEXT_PUBLIC_SITE_URL` - Production site URL
- `JWT_SECRET` - For custom authentication logic

✅ **Complete Setup Guide** (`docs/SUPABASE_REDIRECT_SETUP.md`)
- Step-by-step Supabase dashboard configuration
- Wildcard pattern examples
- Troubleshooting guide
- Security best practices

✅ **Deployment Checklist** (`DEPLOYMENT_CHECKLIST.md`)
- Pre-deployment verification steps
- Testing procedures
- Post-deployment monitoring
- Common issues and solutions

## Quick Setup Steps

### 1. Configure Supabase Redirect URLs (5 minutes)

Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **Authentication** → **URL Configuration**

**Set Site URL:**
```
https://demo-nextjs-with-supabase.vercel.app
```

**Add Redirect URLs:**
```
http://localhost:3000/**
https://demo-nextjs-with-supabase.vercel.app/**
https://*-<your-vercel-team-slug>.vercel.app/**
```

### 2. Update Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=https://demo-nextjs-with-supabase.vercel.app
JWT_SECRET=<generate-with: openssl rand -base64 32>
```

### 3. Deploy to Vercel

Set the same environment variables in Vercel project settings.

### 4. Test Authentication

- Sign up at `/auth/signup`
- Verify email confirmation works
- Sign in with 2FA code
- Test password reset
- Verify admin dashboard access

## URL Resolution Flow

The app automatically determines the correct URL:

```
1. Check NEXT_PUBLIC_SITE_URL env var (production)
   ↓ (not set)
2. Check NEXT_PUBLIC_VERCEL_URL env var (Vercel sets automatically)
   ↓ (not set)
3. Use localhost:3000 (local development)
```

## Redirect URLs by Environment

| Environment | URL Pattern | Use Case |
|-------------|------------|----------|
| Local Dev | `http://localhost:3000/**` | Testing locally |
| Production | `https://demo-nextjs-with-supabase.vercel.app/**` | Live users |
| Preview | `https://*-team-slug.vercel.app/**` | PR previews |

## Usage in Code

```typescript
import { getURL } from '@/lib/url-helpers'

// OAuth sign-in
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(), // Automatically correct URL
  },
})

// Email sign-in
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: getURL(), // Automatically correct URL
  },
})
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Redirect URL doesn't match" | Add URL to Supabase redirect list with wildcards |
| Email confirmation not working | Update email template to use `{{ .RedirectTo }}` |
| OAuth not redirecting correctly | Use `getURL()` helper function |
| Vercel preview URLs failing | Add `https://*-team-slug.vercel.app/**` pattern |

## Files Created/Modified

- ✅ `lib/url-helpers.ts` (27 lines) - Dynamic URL detection
- ✅ `docs/SUPABASE_REDIRECT_SETUP.md` (286 lines) - Complete guide
- ✅ `DEPLOYMENT_CHECKLIST.md` (202 lines) - Pre-deployment checklist
- ✅ `.env.example` (updated) - Environment variables template

## Next Steps

1. ✅ Configure Supabase redirect URLs (see `docs/SUPABASE_REDIRECT_SETUP.md`)
2. ✅ Set environment variables locally and on Vercel
3. ✅ Test authentication flows locally
4. ✅ Deploy to Vercel
5. ✅ Test production authentication
6. ✅ Monitor logs for errors

## Documentation Reference

- **Setup Guide**: `docs/SUPABASE_REDIRECT_SETUP.md` (comprehensive)
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md` (step-by-step)
- **URL Helpers**: `lib/url-helpers.ts` (code reference)
- **RBAC Architecture**: `docs/RBAC_ARCHITECTURE.md` (security)

## Support

For issues:
1. Check `DEPLOYMENT_CHECKLIST.md` troubleshooting section
2. Review `docs/SUPABASE_REDIRECT_SETUP.md` for detailed explanations
3. Check Supabase logs in dashboard
4. Verify all environment variables are set correctly

---

**Status**: ✅ Ready for production deployment
**Last Updated**: 2024
