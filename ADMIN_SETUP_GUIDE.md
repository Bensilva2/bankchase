# Chase Bank Admin Authentication System

Complete implementation guide for the admin portal with role-based access control.

## Overview

The admin authentication system provides:
- Secure login/logout with JWT tokens
- Password recovery via email reset links
- Role-based access control (RBAC)
- Automatic token refresh
- Protected routes with authorization checks

## Database Setup

### 1. Apply Migrations

```bash
# Run the password reset tokens migration
psql -U postgres -d bankchase < scripts/010_create_password_reset_tokens.sql
```

### 2. Initialize Admin Account

Create the first admin user using the setup endpoint (protected with token):

```bash
# Set SETUP_TOKEN environment variable first
export SETUP_TOKEN="your-secure-setup-token"

# Call the initialization endpoint
curl -X POST http://localhost:8000/api/setup/init-admin \
  -H "x-setup-token: $SETUP_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "admin": {
    "id": "user-id",
    "email": "admin@chasebank.com",
    "role": "admin"
  }
}
```

## Frontend Configuration

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Routes

| Route | Purpose |
|-------|---------|
| `/admin/login` | Admin login page |
| `/admin/forgot-password` | Password recovery request |
| `/admin/reset-password?token=...` | Password reset with token |
| `/admin` | Admin dashboard (protected) |
| `/admin/security` | Security center (protected) |
| `/admin/demo-money` | Demo money transfers (protected) |
| `/unauthorized` | Access denied page |

## Authentication Flow

### Login Flow

```
1. User enters email and password
2. POST /api/auth/login
3. Backend verifies credentials
4. Returns access_token and refresh_token
5. Frontend stores tokens in localStorage
6. Redirect to /admin dashboard
```

### Password Reset Flow

```
1. User clicks "Forgot Password?"
2. POST /api/auth/forgot-password with email
3. Backend generates reset token (1-hour expiry)
4. Email sent with reset link: /admin/reset-password?token=xxx
5. User resets password with new password
6. POST /api/auth/reset-password with token and new password
7. Backend validates token and updates password
8. Redirect to login to re-authenticate
```

### Protected Routes

```
1. User loads protected page (e.g., /admin)
2. ProtectedRoute component checks localStorage for access_token
3. If no token, redirect to /admin/login
4. If token exists, verify with backend: GET /auth/verify
5. If expired, attempt refresh with refresh_token
6. If refresh succeeds, update tokens and continue
7. If all fails, redirect to /admin/login
8. On success, check required roles
9. If user lacks role, redirect to /unauthorized
```

## API Endpoints

### Authentication

#### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "admin@chasebank.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLC...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "admin@chasebank.com",
  "first_name": "Admin",
  "last_name": "User"
}
```

#### GET /auth/verify
Verify current JWT token

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "valid": true,
  "user_id": "uuid",
  "email": "admin@chasebank.com",
  "role": "admin"
}
```

#### POST /auth/refresh
Refresh expired access token

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLC..."
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLC...",
  "token_type": "bearer"
}
```

#### POST /auth/forgot-password
Request password reset

**Request:**
```json
{
  "email": "admin@chasebank.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### POST /auth/reset-password
Reset password with token

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

#### POST /auth/logout
Logout and revoke token

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Successfully logged out. Please discard your access token."
}
```

## Password Requirements

All passwords must meet these requirements:
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Example valid password: `Chase@Bank2026!`

## Role-Based Access Control

### Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access to admin panel, user management, security |
| `editor` | Create/edit content, view analytics |
| `viewer` | View-only access to dashboards |
| `user` | Regular user access (non-admin) |

### Protected Component Usage

```tsx
// Protect entire page
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={['admin']}>
      <div>Admin Content</div>
    </ProtectedRoute>
  );
}

// Protect admin-only page
<ProtectedRoute requiredRole={['admin']}>
  {/* Only admin users see this */}
</ProtectedRoute>

// Multiple roles allowed
<ProtectedRoute requiredRole={['admin', 'editor']}>
  {/* Admin or editor users see this */}
</ProtectedRoute>
```

## Token Management

### Access Token
- **Lifetime:** 15 minutes
- **Purpose:** Authenticate API requests
- **Location:** localStorage
- **Sent in:** `Authorization: Bearer <token>` header

### Refresh Token
- **Lifetime:** 7 days
- **Purpose:** Obtain new access tokens without re-login
- **Location:** localStorage
- **Sent in:** Request body to `/auth/refresh`

### Token Refresh Logic

The ProtectedRoute component automatically handles:
1. Checking token validity on page load
2. Detecting token expiration (401 response)
3. Using refresh token to get new access token
4. Updating both tokens in localStorage
5. Retrying original request with new token
6. Redirecting to login if refresh fails

## Security Best Practices

1. **HTTPS Only** - Always use HTTPS in production
2. **HttpOnly Cookies** - Consider moving tokens to HttpOnly cookies instead of localStorage
3. **Token Rotation** - Refresh tokens are automatically rotated
4. **Rate Limiting** - Implement rate limits on login endpoint
5. **CSRF Protection** - Validate CSRF tokens on state-changing requests
6. **Session Timeout** - Consider session timeout after inactivity
7. **Password Strength** - Enforce strong passwords (already implemented)
8. **Email Verification** - Verify email addresses on password reset

## Troubleshooting

### "Invalid credentials" on login
- Verify email and password are correct
- Check database contains the admin user
- Ensure backend service is running

### "Reset token has expired"
- Reset tokens expire after 1 hour
- User must request a new reset link
- Check server time is synchronized

### "User not found" on protected routes
- Verify user exists in database
- Check token contains valid user_id
- Ensure user_id in token matches database

### Token refresh not working
- Verify refresh_token is stored in localStorage
- Check refresh token hasn't expired (7 days)
- Ensure backend /auth/refresh endpoint is running

## Testing

### Manual Testing

1. **Login Test**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chasebank.com","password":"ChaseAdmin2026!"}'
```

2. **Verify Token**
```bash
curl -X GET http://localhost:8000/auth/verify \
  -H "Authorization: Bearer <access_token>"
```

3. **Refresh Token**
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

4. **Logout**
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Admin user created with secure password
- [ ] Environment variables configured
- [ ] SETUP_TOKEN revoked or removed after admin creation
- [ ] HTTPS enabled in production
- [ ] Password reset email template configured
- [ ] Rate limiting enabled on login endpoint
- [ ] CORS configured for frontend domain
- [ ] Error logging configured (Sentry, etc.)
- [ ] Monitor token refresh failures
