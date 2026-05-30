# Role-Based Access Control (RBAC) Architecture

## Overview

BankChase implements strict Role-Based Access Control (RBAC) to ensure complete isolation between retail customer accounts and administrative functions. This architecture guarantees that when a new user registers, they receive a unique, isolated account with zero balance, and their security token restricts them from viewing administrative data, logs, or other users' profiles.

## User Roles

### 1. **Customer** (Default Role)
- Restricted to personal account management only
- Can only view/modify their own profile
- Can only access their own account and transaction history
- **Permissions:**
  - `read:own_profile` - View their own profile information
  - `update:own_profile` - Update their own profile
  - `read:own_account` - View their own account details and zero-starting balance
  - `read:own_transactions` - View their own transaction history
  - `create:own_transfers` - Initiate transfers from their account

### 2. **Admin** (Administrative Role)
- Full system access for management and oversight
- Can view all user accounts and profiles
- Can view all transactions and system logs
- Can manage user roles and account statuses
- **Permissions:**
  - All permissions including:
    - `read:all_users` - View all user profiles
    - `update:user_roles` - Modify user roles
    - `delete:users` - Delete user accounts
    - `read:all_accounts` - View all accounts
    - `read:all_transactions` - View all transactions
    - `read:audit_logs` - Access audit logs
    - `access:admin_dashboard` - Access admin dashboard

### 3. **Auditor** (Compliance Role)
- Read-only access to audit and compliance data
- Can view login history and system logs
- Cannot modify any data
- **Permissions:**
  - `read:audit_logs` - View admin actions
  - `read:login_history` - View login attempts
  - `read:transactions` - View transaction history

## Key Security Features

### 1. **Database Isolation**
```sql
-- User can only access their own data via SQL
SELECT * FROM accounts WHERE user_id = $1  -- $1 is authenticated user ID
```

### 2. **JWT Token-Based Authentication**
- Tokens contain role information
- Tokens expire in 7 days
- Each request validates token and extracts user ID

### 3. **Two-Factor Authentication (2FA)**
- 6-digit codes sent to registered phone/email
- Codes expire after 5 minutes
- Single-use tokens (marked as used after verification)

### 4. **Password Reset Security**
- Reset tokens are hashed before storage
- Tokens expire after 15 minutes
- Prevents token replay attacks

### 5. **Audit Logging**
Every admin action is logged:
- Admin user ID
- Action type (VIEW_ALL_USERS, UPDATE_USER_ROLE, etc.)
- Target resource
- Target user ID
- IP address
- User agent
- Detailed action parameters

### 6. **Login History Tracking**
All login attempts are recorded:
- User ID
- IP address
- User agent/device
- Success/failure status
- Failure reason (if applicable)

## API Endpoints

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Body: {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}
Response: {
  userId: string
  accountNumber: string (unique, auto-generated)
  initialBalance: "0.00"
}
```

#### Login
```
POST /api/auth/login
Body: {
  email: string
  password: string
}
Response: {
  requiresTwoFA: true
  userId: string
}
```

#### Verify 2FA
```
POST /api/auth/verify-2fa
Body: {
  userId: string
  code: string (6-digit code)
}
Response: {
  token: string (JWT)
  user: { ... }
}
```

#### Request Password Reset
```
POST /api/auth/reset-password/request
Body: {
  email: string
}
Response: {
  message: "If account exists, reset link sent"
}
```

#### Confirm Password Reset
```
POST /api/auth/reset-password/confirm
Body: {
  token: string
  newPassword: string
  confirmPassword: string
}
Response: {
  message: "Password reset successful"
}
```

### Customer Endpoints

#### Get Profile
```
GET /api/customer/profile
Headers: {
  Authorization: Bearer <JWT_TOKEN>
}
Response: {
  profile: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone: string
    role: "customer"
  }
  account: {
    accountNumber: string
    balance: number
    status: "active"
  }
}
```

#### Update Profile
```
PUT /api/customer/profile
Headers: {
  Authorization: Bearer <JWT_TOKEN>
}
Body: {
  firstName: string
  lastName: string
  phoneNumber: string
}
Response: {
  message: "Profile updated"
  profile: { ... }
}
```

### Admin Endpoints

#### List All Users
```
GET /api/admin/users
Headers: {
  Authorization: Bearer <ADMIN_JWT_TOKEN>
}
Response: {
  users: [
    {
      id: string
      email: string
      firstName: string
      lastName: string
      role: "customer" | "admin" | "auditor"
    }
  ]
}
```

#### Update User Role
```
PUT /api/admin/users
Headers: {
  Authorization: Bearer <ADMIN_JWT_TOKEN>
}
Body: {
  userId: string
  role: "customer" | "admin" | "auditor"
}
Response: {
  message: "User role updated"
}
```

#### Delete User
```
DELETE /api/admin/users
Headers: {
  Authorization: Bearer <ADMIN_JWT_TOKEN>
}
Body: {
  userId: string
}
Response: {
  message: "User deleted"
}
```

#### Get Audit Logs
```
GET /api/admin/audit-logs?page=1&limit=50&adminId=<id>&actionType=VIEW_ALL_USERS&startDate=2024-01-01&endDate=2024-12-31
Headers: {
  Authorization: Bearer <ADMIN_OR_AUDITOR_JWT_TOKEN>
}
Response: {
  logs: [
    {
      id: string
      adminEmail: string
      adminName: string
      actionType: string
      targetResource: string
      ipAddress: string
      createdAt: timestamp
    }
  ]
  pagination: {
    page: number
    total: number
    totalPages: number
  }
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(15),
  role user_role DEFAULT 'customer', -- Strictly typed
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  account_number VARCHAR(20) UNIQUE NOT NULL,
  balance NUMERIC(18, 4) DEFAULT 0.0000, -- Zero balance guaranteed
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP
);
```

### 2FA Codes Table
```sql
CREATE TABLE two_factor_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

### Password Resets Table
```sql
CREATE TABLE password_resets (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

### Admin Audit Logs Table
```sql
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  target_resource VARCHAR(255),
  target_user_id UUID REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP
);
```

### Login History Table
```sql
CREATE TABLE login_history (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_name VARCHAR(255),
  success BOOLEAN DEFAULT TRUE,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP
);
```

## Security Best Practices

### For Customers
1. Never share your JWT token with anyone
2. Tokens are valid for 7 days, then you must log in again
3. Use strong passwords with uppercase, lowercase, numbers, and symbols
4. Enable 2FA for account protection
5. Change password immediately if you suspect compromise

### For Admins
1. Use separate admin accounts (not customer accounts with elevated privileges)
2. All admin actions are logged and auditable
3. Never query user data without business justification
4. IP addresses are logged for all admin actions
5. Regularly review audit logs for suspicious activity

### For Developers
1. Always verify role before allowing admin operations
2. Never query database without filtering by authenticated user ID
3. Use parameterized queries to prevent SQL injection
4. Hash sensitive tokens before storage
5. Log all security-relevant events
6. Implement rate limiting on authentication endpoints
7. Use HTTPS for all API communication

## Testing

### Test Customer Isolation
```bash
# Register as customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!","firstName":"John","lastName":"Doe"}'

# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'

# Verify customer can only see their own profile
curl -X GET http://localhost:3000/api/customer/profile \
  -H "Authorization: Bearer <token>"

# Verify customer cannot access admin endpoints (should get 403)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <customer-token>"
```

### Test Admin Access
```bash
# Admin can view all users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin-token>"

# All admin actions are logged
curl -X GET http://localhost:3000/api/admin/audit-logs \
  -H "Authorization: Bearer <admin-token>"
```

## Compliance & Auditing

- ✅ All user data is isolated by user ID at the database level
- ✅ Zero-balance guarantee on account creation
- ✅ All admin actions are immutable audit logged
- ✅ Passwords are bcrypt hashed with 10 rounds
- ✅ Tokens are JWT signed with HS256
- ✅ 2FA codes expire and are single-use
- ✅ Login attempts are tracked with IP and device info
- ✅ Role-based access control is enforced at API level
- ✅ SQL Row Level Security (RLS) provides database-level protection
