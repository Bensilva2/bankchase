# BankChase RBAC Quick Start Guide

## 🚀 Getting Started

### 1. Run Database Migration
```sql
-- Copy and paste entire content of: migrations/003-rbac-and-auth.sql
-- Run in Supabase SQL Editor
```

### 2. Set Environment Variable
```bash
# Generate a strong JWT secret
openssl rand -base64 32

# Add to your .env.local:
JWT_SECRET=<your-generated-secret>
```

---

## 📝 API Examples

### Register a New Customer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

**Response:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "accountNumber": "1234567890",
  "initialBalance": "0.00"
}
```

### Login (Get 2FA Challenge)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "requiresTwoFA": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Verification code sent"
}
```

### Verify 2FA Code
```bash
# Get 6-digit code from database (for testing):
# SELECT code FROM two_factor_codes WHERE user_id = '<userId>' 
# ORDER BY created_at DESC LIMIT 1;

curl -X POST http://localhost:3000/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "code": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Get Customer Profile
```bash
curl -X GET http://localhost:3000/api/customer/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response:**
```json
{
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "customer",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "account": {
    "accountNumber": "1234567890",
    "balance": 0.0,
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Customer Profile
```bash
curl -X PUT http://localhost:3000/api/customer/profile \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jonathan",
    "lastName": "Smith",
    "phoneNumber": "+1987654321"
  }'
```

### Admin: List All Users
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Admin: Update User Role
```bash
curl -X PUT http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "admin"
  }'
```

### Admin: View Audit Logs
```bash
curl -X GET "http://localhost:3000/api/admin/audit-logs?page=1&limit=50&actionType=UPDATE_USER_ROLE" \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Password Reset Request
```bash
curl -X POST http://localhost:3000/api/auth/reset-password/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Password Reset Confirm
```bash
# Use token from email link (in production)
curl -X POST http://localhost:3000/api/auth/reset-password/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456...",
    "newPassword": "NewPassword456!",
    "confirmPassword": "NewPassword456!"
  }'
```

---

## 🔑 Understanding Roles

### Customer
- **Default role** for new registrations
- Can view/update own profile
- Can view own account and balance
- Can create transfers from own account
- **Cannot** access admin features
- **Cannot** view other user data

### Admin
- Full system access
- Can view all users
- Can change user roles
- Can delete users
- Can view audit logs
- All actions are logged

### Auditor
- Read-only access to compliance data
- Can view audit logs
- Can view login history
- Can view transactions
- **Cannot** modify any data

---

## 🔐 Security Notes

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

### 2FA Codes
- 6 random digits
- Valid for 5 minutes
- Single-use only
- Cannot be reused

### JWT Tokens
- Valid for 7 days
- Stored in httpOnly cookies
- Include user ID and role
- Signed with HS256

### Reset Tokens
- Hashed with SHA256 before storage
- Valid for 15 minutes
- Single-use only
- Never sent in response

---

## 🧪 Testing Workflow

```bash
# 1. Register as customer
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }')

USER_ID=$(echo $RESPONSE | jq -r '.userId')
echo "Registered user: $USER_ID"

# 2. Login and get 2FA challenge
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"TestPass123!\"}"

# 3. Get 2FA code from database (for testing)
# SELECT code FROM two_factor_codes WHERE user_id = '<USER_ID>' LIMIT 1;

# 4. Verify 2FA and get JWT token
JWT=$(curl -s -X POST http://localhost:3000/api/auth/verify-2fa \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"code\": \"123456\"}" | jq -r '.token')

echo "JWT Token: $JWT"

# 5. Access protected endpoint
curl -X GET http://localhost:3000/api/customer/profile \
  -H "Authorization: Bearer $JWT"

# 6. Try accessing admin endpoint (should fail with 403)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $JWT"
```

---

## 📚 Documentation

- **Complete Guide**: `docs/RBAC_ARCHITECTURE.md`
- **Implementation Details**: `RBAC_IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `migrations/003-rbac-and-auth.sql`

---

## ❌ Common Errors

### "Unauthorized: Missing or invalid token"
- JWT token is missing or invalid
- Check Authorization header is set correctly
- Check token hasn't expired (7 days)

### "Unauthorized: Admin access required"
- User role is not 'admin'
- Only admins can access `/api/admin/*` endpoints

### "Invalid or expired authorization token"
- Password reset token has expired (15 minutes)
- Password reset token has already been used
- Password reset token is invalid

### "Invalid or expired verification code"
- 2FA code is incorrect
- 2FA code has expired (5 minutes)
- 2FA code has already been used

---

## ✅ Success Indicators

- ✅ New user registers as 'customer'
- ✅ New account has $0.00 balance
- ✅ Login requires 2FA verification
- ✅ Customer can only view own data
- ✅ Customer cannot access /api/admin/*
- ✅ Admin can view all users
- ✅ All admin actions logged to database
- ✅ Login attempts tracked with IP address

---

**For detailed information, see:** `docs/RBAC_ARCHITECTURE.md`
