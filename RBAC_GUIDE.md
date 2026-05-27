Role-Based Access Control (RBAC) Implementation Guide
====================================================

## Overview

BankChase implements a three-tier role-based access control system:
- **Admin**: Full access to all features including admin dashboard
- **Editor**: Can create, read, and update resources (future use)
- **Viewer**: Read-only access (default for new users)

## User Roles & Permissions

### Viewer Role (Default for New Users)
- Read-only access to accounts and transactions
- Can view personal profile
- Cannot create new accounts or make transfers
- Cannot access admin dashboard

**Permissions:**
- `read:accounts` - View account details
- `read:transactions` - View transaction history
- `read:users` - View user profiles (limited to own profile)

### Editor Role (Future)
- Can create, read, and update accounts/transactions
- Extended functionality for power users

**Permissions:**
- `create:accounts` - Create new accounts
- `read:accounts` - View accounts
- `update:accounts` - Modify account details
- `create:transactions` - Create transactions
- `read:transactions` - View transactions
- `read:users` - View user profiles

### Admin Role
- Full access to all system features
- Access to admin dashboard
- Can manage users and permissions
- Can promote other users to admin

**Permissions:**
- All CRUD operations on all resources
- `access:admin_dashboard` - Access admin panel
- User management capabilities

## Database Schema

```sql
-- Users table includes role column
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer', -- admin, editor, or viewer
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  ...
);

-- Permissions are defined in the RBAC utility
-- Each role has predefined permissions
```

## File Structure

- `lib/rbac.ts` - Core RBAC utilities and permission definitions
- `scripts/003-add-rbac-roles.sql` - Database migration
- `migrations/002_add_user_roles.sql` - Role column setup
- `middleware.ts` - Route protection and role checking
- `app/admin/page.tsx` - Admin dashboard (protected)
- `app/api/admin/setup/route.ts` - Admin setup endpoint

## Usage Examples

### Check User Role

```typescript
import { isAdmin, isEditor, isViewer, hasRole } from '@/lib/rbac'

// Check specific role
if (isAdmin(user)) {
  // Admin-specific logic
}

// Check generic role
if (hasRole(user, 'admin')) {
  // Admin-specific logic
}
```

### Check Permission

```typescript
import { checkPermission } from '@/lib/rbac'

if (checkPermission(user, 'read', 'accounts')) {
  // User can read accounts
}
```

### Protect Components

```typescript
import { canAccessAdminDashboard } from '@/lib/rbac'

export default function AdminDashboard() {
  const { user } = useAuth()
  
  if (!canAccessAdminDashboard(user)) {
    return <AccessDenied />
  }
  
  return <AdminPanel />
}
```

## Protected Routes

Routes automatically protected by middleware based on role:

| Route | Required Auth | Required Role |
|-------|---------------|---------------|
| `/dashboard` | Yes | Any (viewer+) |
| `/accounts` | Yes | Any (viewer+) |
| `/transactions` | Yes | Any (viewer+) |
| `/transfer` | Yes | Any (viewer+) |
| `/profile` | Yes | Any (viewer+) |
| `/admin` | Yes | admin only |

## New User Registration Flow

1. User signs up with email/password
2. User is assigned **viewer** role automatically
3. User can access: dashboard, accounts, transactions, profile
4. User CANNOT access: admin dashboard or admin features
5. User has zero balance by default

## Promoting User to Admin

### Method 1: Direct API Call (Initial Setup)
```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d { "email": "admin@example.com" }
```

### Method 2: As Existing Admin
```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_user={session}" \
  -d { "email": "newadmin@example.com" }
```

## Session Management

User role is stored in the session cookie:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "viewer",
  "emailVerified": true,
  "firstName": "John",
  "lastName": "Doe"
}
```

The middleware reads this role for route protection.

## Security Considerations

1. **Role Stored in Session**: Role is read from HTTP-only session cookie
2. **Server-Side Verification**: All permission checks happen server-side
3. **Middleware Protection**: Protected routes redirect to login if not authenticated
4. **Admin Access**: Admin endpoints require admin role
5. **Zero Balance Default**: New accounts created with $0.00 balance

## Adding New Roles

To add a new role:

1. Update `UserRole` type in `lib/rbac.ts`
2. Add new role to `ROLE_PERMISSIONS` object
3. Update role enum in database migration
4. Update middleware route requirements if needed

Example:

```typescript
export type UserRole = 'admin' | 'editor' | 'viewer' | 'moderator'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  moderator: [
    // Define moderator permissions
  ],
  // ... rest of roles
}
```

## Future Enhancements

- [ ] Dynamic permission assignment per user
- [ ] Permission-based UI hiding (show/hide buttons based on permissions)
- [ ] Audit logging for admin actions
- [ ] Bulk user role updates
- [ ] Permission templates
- [ ] Role-based API rate limiting
