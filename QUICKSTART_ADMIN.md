# Quick Start: Admin Login

## TL;DR

### 1. Create Admin User (One Time)
```bash
curl -X POST http://localhost:3000/api/setup/init-admin
```

### 2. Log In as Admin
- Go to http://localhost:3000/login
- Email: `admin@bankchase.com`
- Password: `Admin@123456`
- You'll be redirected to `/admin` dashboard

### 3. Create Regular User
- Go to http://localhost:3000/signup
- Fill in the form
- You'll be redirected to `/accounts` dashboard

## What Was Fixed?

✅ **Registration now works** - Creates users in Supabase  
✅ **Login now works** - Authenticates against Supabase  
✅ **Admin access works** - Role-based routing and access control  
✅ **Token handling fixed** - Consistent JWT format with role support  

## The Flow

```
User Signup → New user created with role='viewer' → /accounts
    ↓
User Login → Check credentials in Supabase → Route by role
    ↓
Admin Login → Redirected to /admin (if role='admin')
Regular User → Redirected to /accounts (if role='viewer')
```

## All Options Now Working

| Feature | Status | How It Works |
|---------|--------|-------------|
| **Register** | ✅ Fixed | Users sign up with email/password, stored in Supabase |
| **Login** | ✅ Fixed | Authenticates against Supabase, returns JWT with role |
| **Admin Dashboard** | ✅ Fixed | Admin users (role='admin') can access `/admin` |
| **User Dashboard** | ✅ Fixed | Regular users can access `/accounts` |
| **Role-Based Access** | ✅ Fixed | Non-admins blocked from admin pages |

## Files to Know

- **Admin Setup**: `/api/setup/init-admin` - Call this once to create admin
- **Login Page**: `/app/login/page.tsx` - Updated with new auth flow
- **Auth Context**: `/lib/auth-context.tsx` - Handles token decoding and role checking
- **Documentation**: `/ADMIN_SETUP.md` - Detailed admin setup guide

## Next: Delete Setup Endpoint (Production Only)

After creating the admin user, **delete or secure** the setup endpoint:

```bash
# Option 1: Delete the file
rm /app/api/setup/init-admin/route.ts

# Option 2: Add authentication check to the file
# Add logic to verify a valid admin token before allowing setup
```

## Common Issues & Fixes

**Q: Admin redirect to /accounts instead of /admin?**
A: Check that the user's role in Supabase is set to `'admin'` not `'viewer'`

**Q: "Invalid email or password" on login?**
A: Make sure you created the admin user first with the setup endpoint

**Q: Token errors or blank dashboard?**
A: Check browser console for errors, ensure JWT_SECRET env var is set

## Support

See `/ADMIN_SETUP.md` for detailed troubleshooting and setup options.
