# Admin Setup Guide

## Admin Credentials

**Default Admin Account:**
- Email: `admin@bankchase.com`
- Password: `Admin@123456`
- Role: `admin`

## Creating the Admin User

### Option 1: Using the Setup API Endpoint (One-Time)

Call the initialization endpoint once after deployment to create the admin user:

```bash
curl -X POST http://localhost:3000/api/setup/init-admin
```

**Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "admin": {
    "email": "admin@bankchase.com",
    "password": "Admin@123456",
    "role": "admin"
  }
}
```

⚠️ **IMPORTANT**: Disable or delete the `/api/setup/init-admin/route.ts` endpoint after creating the admin user in production for security reasons.

### Option 2: Manual Database Insert

If you prefer to create the admin user directly in Supabase:

```sql
-- Hash the password: Admin@123456
-- Use bcrypt with 10 salt rounds to hash the password first

INSERT INTO users (
  username,
  email,
  password_hash,
  first_name,
  last_name,
  role,
  phone,
  date_of_birth,
  address,
  city,
  state,
  zip_code
) VALUES (
  'admin',
  'admin@bankchase.com',
  '<bcrypt_hashed_password>',
  'Admin',
  'User',
  'admin',
  '1-800-ADMIN-1',
  '1990-01-01',
  '123 Admin Street',
  'Admin City',
  'AC',
  '12345'
);

-- Also create a default checking account
INSERT INTO accounts (
  user_id,
  account_type,
  account_number,
  routing_number,
  balance,
  bank_name,
  is_external
) VALUES (
  '<user_id_from_above>',
  'Checking',
  '1234567890',
  '021000021',
  10000.00,
  'Chase Bank',
  false
);
```

## Authentication Flow

### Registration
1. User signs up with email and password
2. New user account is created in Supabase with role `viewer`
3. Default checking account is created with $0.00 balance
4. JWT token is generated and returned
5. User is redirected to `/accounts`

### Login
1. User provides email and password
2. System authenticates against Supabase users table
3. Password is verified using bcrypt
4. JWT token is generated with role included
5. User is redirected based on role:
   - **Admin users** → `/admin` (Admin Dashboard)
   - **Regular users** → `/accounts` (User Dashboard)

## Token Format

JWT tokens include the following payload:

```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "username": "username",
  "firstName": "First",
  "lastName": "Last",
  "role": "admin|viewer|editor",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## User Roles

- **admin**: Full access to admin dashboard, user management, security monitoring
- **editor**: Can create and manage accounts/transactions
- **viewer**: Read-only access (default for new users)

## Security Notes

1. **Setup endpoint is public** - After initial admin creation, secure or delete `/api/setup/init-admin/route.ts`
2. **Passwords are hashed** - All passwords use bcrypt with 10 salt rounds
3. **JWT tokens expire** - Default expiry is 7 days
4. **Role-based access control** - Admin pages check user role before rendering

## Testing the Admin Dashboard

1. Navigate to http://localhost:3000/login
2. Enter admin credentials:
   - Email: `admin@bankchase.com`
   - Password: `Admin@123456`
3. You should be redirected to `/admin`
4. If you get "Access Denied", ensure the admin user was created with role `admin`

## Troubleshooting

### "Admin user already exists" message
The admin user has already been created in the database. This is expected on subsequent API calls.

### Admin login redirects to /accounts instead of /admin
Check that the user's role in the database is set to `admin` (not `viewer` or `editor`)

### JWT token verification fails
- Ensure `JWT_SECRET` environment variable matches across all instances
- Check token expiry time hasn't elapsed
- Verify token format is correct (Bearer token in Authorization header)

## Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side operations
- `JWT_SECRET` - Secret key for signing JWT tokens (default: 'your-secret-key-change-in-production')
