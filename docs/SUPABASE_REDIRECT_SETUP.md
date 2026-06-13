# Supabase Redirect URLs Configuration Guide

This guide walks you through configuring redirect URLs for your Supabase project, which is essential for OAuth authentication, email confirmations, and password resets to work properly.

## Overview

When your Next.js app authenticates users via Supabase (either through email/password or OAuth providers like Google, GitHub, etc.), the user must be redirected back to your app after authentication. Supabase requires you to explicitly allow these redirect URLs for security reasons.

## Quick Start for Your Deployment

Your app is deployed on Vercel at:
- **Production**: `https://demo-nextjs-with-supabase.vercel.app`
- **Current Deployment**: `https://demo-nextjs-with-supabase-7793avk48-supabase.vercel.app`

### Step 1: Log into Supabase Dashboard

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your BankChase project
3. Navigate to **Authentication** → **URL Configuration** (or **Auth** → **Settings**)

### Step 2: Set Your Site URL

The **Site URL** is the primary URL of your application:

**For Production:**
```
https://demo-nextjs-with-supabase.vercel.app
```

**For Local Development:**
```
http://localhost:3000
```

> **Note**: The Site URL is the default redirect URL when no explicit `redirectTo` is specified in your code.

### Step 3: Add Redirect URLs

Add all the following URLs to your **Redirect URLs** list:

```
http://localhost:3000/**
https://demo-nextjs-with-supabase.vercel.app/**
https://*-<your-vercel-team-slug>.vercel.app/**
```

**Replace `<your-vercel-team-slug>` with your actual Vercel team slug** (e.g., if your preview URLs look like `https://my-app-preview-feature-abc123.vercel.app`, your team slug is after the first hyphen).

#### Example Wildcard URLs:

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/**` | Local development with any path |
| `https://demo-nextjs-with-supabase.vercel.app/**` | Production deployment |
| `https://*-my-team.vercel.app/**` | All Vercel preview deployments for your team |

### Step 4: Configure Environment Variables

Create or update `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site URL for production (matches your Supabase Site URL)
NEXT_PUBLIC_SITE_URL=https://demo-nextjs-with-supabase.vercel.app

# JWT Secret for custom auth logic
JWT_SECRET=your-generated-secret-key-here
```

### Step 5: Deploy to Vercel

When deploying to Vercel:

1. Go to your Vercel Project Settings
2. Navigate to **Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
NEXT_PUBLIC_SITE_URL = https://demo-nextjs-with-supabase.vercel.app
JWT_SECRET = your-generated-secret-key-here
```

## How It Works

### Local Development Flow

```
User clicks "Sign In" on http://localhost:3000
         ↓
App redirects to Supabase OAuth flow
         ↓
User authenticates with email/password or OAuth provider
         ↓
Supabase checks if redirect URL matches allowed list:
  ✅ http://localhost:3000/** matches ✓
         ↓
User is redirected back to http://localhost:3000/auth/callback
         ↓
Session is established ✓
```

### Production Flow on Vercel

```
User clicks "Sign In" on https://demo-nextjs-with-supabase.vercel.app
         ↓
App redirects to Supabase OAuth flow
         ↓
User authenticates with email/password or OAuth provider
         ↓
Supabase checks if redirect URL matches allowed list:
  ✅ https://demo-nextjs-with-supabase.vercel.app/** matches ✓
         ↓
User is redirected back to https://demo-nextjs-with-supabase.vercel.app/auth/callback
         ↓
Session is established ✓
```

### Vercel Preview Deployments

When you create pull requests, Vercel automatically creates preview URLs like:
- `https://demo-nextjs-with-supabase-feature-abc123-my-team.vercel.app`

With the wildcard `https://*-my-team.vercel.app/**`, all these preview deployments automatically work!

## Using the getURL() Helper

Your app includes a helper function to dynamically determine the correct redirect URL:

```typescript
// lib/url-helpers.ts
export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Production URL
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Vercel preview/staging
    'http://localhost:3000/' // Local development

  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  return url
}
```

### Using in OAuth Sign-In

```typescript
import { getURL } from '@/lib/url-helpers'

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(), // Automatically uses correct URL
  },
})
```

## Wildcard Pattern Rules

Supabase uses glob patterns for wildcard matching:

| Pattern | Matches | Doesn't Match |
|---------|---------|---------------|
| `*` | Any characters (no `/`) | Paths like `/foo/bar` |
| `**` | Any characters (including `/`) | Nothing! Matches everything |
| `?` | Single character | Multi-character strings |

### Pattern Examples

```
http://localhost:3000/**
├─ ✅ http://localhost:3000/dashboard
├─ ✅ http://localhost:3000/auth/callback
├─ ✅ http://localhost:3000/auth/callback?code=xyz
└─ ✅ http://localhost:3000/any/nested/path

https://*-my-team.vercel.app/**
├─ ✅ https://app-feature-xyz-my-team.vercel.app/
├─ ✅ https://main-abc123-my-team.vercel.app/dashboard
└─ ❌ https://app-other-team.vercel.app/ (different team)
```

## Troubleshooting

### Error: "Redirect URL doesn't match"

**Cause**: The URL in your code doesn't match any of your allowed redirect URLs.

**Solution**:
1. Check the exact URL that's failing (check browser console)
2. Verify it's in your Supabase redirect URL list
3. Use the wildcard pattern to catch variations

### Email Confirmation Not Working

**Cause**: Email redirect URL not configured in email templates.

**Solution**: In Supabase Email Templates, replace `{{ .SiteURL }}` with `{{ .RedirectTo }}`:

```html
<!-- Old -->
<a href="{{ .SiteURL }}/auth/confirm">Confirm email</a>

<!-- New -->
<a href="{{ .RedirectTo }}">Confirm email</a>
```

### OAuth Sign-In Not Working

**Cause**: Missing or incorrect `redirectTo` parameter.

**Solution**: Always use the `getURL()` helper:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: getURL(), // ✅ Correct
  },
})
```

### Password Reset Fails

**Cause**: Reset email links point to wrong URL.

**Solution**:
1. Check email template uses `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`
2. Verify reset token is being passed in the link
3. Ensure your auth callback handler processes the token

## Testing Your Setup

### Test Email/Password Authentication

1. Sign up at `/auth/signup`
2. Verify you receive a confirmation email
3. Click the confirmation link
4. Should be redirected back to your app

### Test OAuth Authentication

1. Try signing in with GitHub/Google
2. You should be redirected back to your app after approving
3. Check browser console for any errors

### Test Password Reset

1. Sign in to an account
2. Try "Forgot Password" flow
3. Check email for reset link
4. Should be redirected back to reset form

## Security Considerations

1. **Never use wildcard domains in production**: Use exact URLs when possible
2. **Keep redirect URLs to minimum**: Only add URLs you actually need
3. **Rotate secrets**: Use strong, unique `JWT_SECRET` values
4. **HTTPS only**: Always use HTTPS in production (HTTP only for localhost)
5. **No sensitive data in URLs**: Don't pass passwords or tokens in query parameters

## Additional Resources

- [Supabase Redirect URLs Docs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Preview Deployments](https://vercel.com/docs/concepts/deployments/preview-deployments)

## Next Steps

1. ✅ Configure Supabase redirect URLs (this guide)
2. ✅ Set environment variables in `.env.local`
3. ✅ Deploy to Vercel and add env vars there
4. ✅ Test email confirmation flow
5. ✅ Test OAuth sign-in (if configured)
6. ✅ Test password reset flow
7. Monitor auth logs in Supabase dashboard

---

**Ready to deploy?** Make sure all redirect URLs are configured before going live!
