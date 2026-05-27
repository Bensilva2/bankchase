BankChase Setup & Deployment Guide
===================================

## Initial Setup

### 1. Database Migration

Run the migrations to set up the auth and RBAC system:

```bash
# Apply Auth0 integration migration
pnpm run db:migrate -- migrations/001_auth0_integration.sql

# Apply role-based access control migration
pnpm run db:migrate -- migrations/002_add_user_roles.sql

# Apply RBAC permissions (if using separate permissions table)
pnpm run db:migrate -- scripts/003-add-rbac-roles.sql
```

### 2. Environment Variables

Ensure these are set in your `.env.local` or project settings:

**Auth Configuration:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_MANAGEMENT_API_TOKEN=your_management_token
OTP_EXPIRY_MINUTES=10
```

### 3. First Admin User

After deploying, create your first admin user:

```bash
# Option 1: Direct API call (first setup)
curl -X POST https://your-app.com/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@yourcompany.com"}'

# Option 2: Using the endpoint with setup token
# (Implement setup token in production for security)
```

## User Access Levels

### Regular User (Viewer Role)
1. **Sign up** with email/password
2. **Receive OTP** for email verification
3. **Verify email** with OTP code
4. **Get default checking account** with $0.00 balance
5. **Access dashboards:**
   - Dashboard (view overview)
   - Accounts (view account details)
   - Transactions (view transaction history)
   - Profile (view/edit personal info)
   - Transfers (make transfers between accounts)

**Restrictions:**
- Cannot access admin dashboard
- Cannot manage users or permissions
- Cannot view other users' data
- Cannot modify system settings
- Starting balance: $0.00

### Admin User
1. **Created by promoting existing user** via `/api/admin/setup`
2. **Full system access:**
   - All regular user features
   - Admin Dashboard
   - User management
   - System settings
   - Access logs
   - Analytics

## Access Control Flow

```
User Registration
    ↓
Assign "viewer" role automatically
    ↓
Create checking account ($0.00 balance)
    ↓
Send OTP for email verification
    ↓
User verifies email
    ↓
User session created with role
    ↓
Middleware checks role for route access
    ↓
Grant access to allowed routes only
```

## Route Protection

### Public Routes
- `/` (login/signup)
- `/auth/login` (API)
- `/auth/register` (API)
- `/auth/otp/*` (API)

### Authenticated Routes (Any User)
- `/dashboard` ✓ Viewers can access
- `/accounts` ✓ Viewers can access
- `/transactions` ✓ Viewers can access
- `/transfer` ✓ Viewers can access
- `/profile` ✓ Viewers can access

### Admin-Only Routes
- `/admin` ✗ Viewers cannot access → redirects to dashboard
- `/api/admin/*` ✗ Requires admin role

## Session Management

User sessions are stored as HTTP-only cookies with structure:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "viewer",
  "emailVerified": true
}
```

**Session Duration:**
- Regular users: 7 days
- OTP verification: 1 hour

## Testing the RBAC System

### 1. Test Regular User Access

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Verify email with OTP
curl -X POST http://localhost:3000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otpCode": "123456"
  }'

# Try accessing dashboard (should work)
curl http://localhost:3000/dashboard \
  -H "Cookie: auth_user={session_cookie}"

# Try accessing admin (should fail)
curl http://localhost:3000/admin \
  -H "Cookie: auth_user={session_cookie}"
# Expected: Redirects to /dashboard
```

### 2. Test Admin Access

```bash
# Promote user to admin
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Access admin dashboard (should work)
curl http://localhost:3000/admin \
  -H "Cookie: auth_user={admin_session}"
```

## Security Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] HTTPS enabled in production
- [ ] HTTP-only cookies enabled
- [ ] CORS configured properly
- [ ] First admin user created
- [ ] OTP email configured
- [ ] Session timeout configured
- [ ] Rate limiting implemented
- [ ] Audit logging enabled

## Troubleshooting

### Users Can't Access Dashboard
1. Check if user has session cookie (`auth_user`)
2. Verify middleware is running
3. Check user role in database (should be 'viewer' or 'admin')
4. Check route requirements in middleware.ts

### Admin Dashboard Shows "Access Denied"
1. Verify user role is 'admin' in database
2. Check if `canAccessAdminDashboard` function is working
3. Clear browser cookies and re-login
4. Verify middleware is protecting /admin route

### OTP Not Working
1. Check if OTP_EXPIRY_MINUTES is set (default 10)
2. Verify email service is configured
3. Check OTP codes table in database
4. Test OTP verification endpoint directly

### Users Seeing Duplicate Accounts
1. Check if default account creation logic is idempotent
2. Verify no duplicate account creation on re-registration
3. Check accounts table for duplicates

## Deployment Checklist

- [ ] Environment variables set in deployment platform
- [ ] Database migrations verified
- [ ] SSL certificate installed
- [ ] CORS headers configured
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] First admin user created
- [ ] Test user signup flow
- [ ] Test login with OTP
- [ ] Test admin dashboard access
- [ ] Monitor error logs post-deployment
