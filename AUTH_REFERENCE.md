# Authentication Reference Card

## Quick Access URLs

| Page | URL | Purpose |
|------|-----|---------|
| **Login** | `http://localhost:3000/login` | User/Admin login |
| **Register** | `http://localhost:3000/signup` | New user registration |
| **User Dashboard** | `http://localhost:3000/accounts` | Regular user dashboard |
| **Admin Dashboard** | `http://localhost:3000/admin` | Admin-only dashboard |
| **Setup Admin** | `POST http://localhost:3000/api/setup/init-admin` | Create admin user |

## API Endpoints

### Authentication Endpoints

```
POST /api/auth/register
├─ Body: {
│   username: string,
│   email: string,
│   password: string,
│   firstName: string,
│   lastName: string
│ }
└─ Returns: { token, user, success }

POST /api/auth/login
├─ Body: { email, password }
└─ Returns: { token, user }

POST /api/setup/init-admin
├─ No body required
└─ Returns: { success, message, admin }
```

## Default Credentials

### Admin User (Create via Setup API)
```
Email:    admin@bankchase.com
Password: Admin@123456
Role:     admin
Status:   Not auto-created - use /api/setup/init-admin
```

### Test Users
```
Create via signup page:
- Any email/password matching requirements
- Auto-assigned role: viewer
- Auto-assigned balance: $0.00
```

## Token Format

### JWT Payload
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "username",
  "firstName": "First",
  "lastName": "Last",
  "role": "admin|viewer|editor",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Using Token in Requests
```
Authorization: Bearer <token>
```

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Server-side auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Client-side auth |
| `JWT_SECRET` | ⚠️ Important | Token signing (change in production) |

## Code Examples

### Login with API Client

```typescript
import ApiClient from '@/lib/api-client'

try {
  const response = await ApiClient.login('user@example.com', 'password123')
  // response.token available
  // response.user available with role
  if (response.user.role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/accounts')
  }
} catch (error) {
  console.error('Login failed:', error.message)
}
```

### Check User Role in Component

```typescript
import { useAuth } from '@/lib/auth-context'

export default function MyComponent() {
  const { user, isAdmin, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <p>Please log in</p>
  }
  
  if (isAdmin) {
    return <AdminPanel />
  }
  
  return <UserDashboard />
}
```

### Verify Admin Access

```typescript
import { canAccessAdminDashboard } from '@/lib/rbac'

if (!user || !canAccessAdminDashboard(user)) {
  return <AccessDenied />
}
```

## Database Schema (Users Table)

```sql
users (
  id              UUID PRIMARY KEY,
  username        VARCHAR UNIQUE NOT NULL,
  email           VARCHAR UNIQUE NOT NULL,
  password_hash   VARCHAR NOT NULL,
  first_name      VARCHAR,
  last_name       VARCHAR,
  role            VARCHAR DEFAULT 'viewer',
  phone           VARCHAR,
  ssn             VARCHAR,
  date_of_birth   DATE,
  address         VARCHAR,
  city            VARCHAR,
  state           VARCHAR,
  zip_code        VARCHAR,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
)
```

## Password Requirements

✅ Minimum 8 characters  
✅ At least 1 lowercase letter  
✅ At least 1 uppercase letter  
✅ At least 1 number  
❌ Special characters not required  

Example valid password: `Admin@123456`

## User Roles & Permissions

```
ADMIN
├─ Access admin dashboard
├─ View all users
├─ Manage system settings
├─ View security metrics
└─ Send demo money transfers

EDITOR (Future)
├─ Create accounts
├─ Edit accounts
├─ View transactions
└─ Export reports

VIEWER (Default)
├─ View own accounts
├─ View own transactions
├─ Download statements
└─ Update profile
```

## Flow Diagrams

### Registration Flow
```
SignupPage
    ↓
validateEmail()
validatePassword()
    ↓
ApiClient.signup()
    ↓
POST /api/auth/register
    ↓
Create user in Supabase (role=viewer)
Create checking account ($0.00)
Generate JWT token
    ↓
Response: { token, user }
    ↓
localStorage.setItem('access_token', token)
    ↓
router.push('/accounts')
    ↓
UserDashboard
```

### Login Flow
```
LoginPage
    ↓
validateEmail()
validatePassword()
    ↓
ApiClient.login()
    ↓
POST /api/auth/login
    ↓
Query Supabase: SELECT * FROM users WHERE email=?
Verify: bcrypt.compare(password, password_hash)
    ↓
If valid:
├─ Generate JWT with role
├─ Return { token, user }
    ↓
localStorage.setItem('access_token', token)
    ↓
Check user.role:
├─ admin → router.push('/admin')
├─ viewer → router.push('/accounts')
    ↓
Dashboard (Admin or User)
```

## Common Tasks

### Create Admin User
```bash
curl -X POST http://localhost:3000/api/setup/init-admin
# Copy the returned credentials for first login
```

### Log In as Admin
1. Go to `http://localhost:3000/login`
2. Enter: `admin@bankchase.com` / `Admin@123456`
3. You'll be redirected to `/admin`

### Create Regular User
1. Go to `http://localhost:3000/signup`
2. Fill in email, password, first name, last name
3. Password must meet requirements (shown in form)
4. You'll be redirected to `/accounts`

### Check Current User Role
```typescript
const { user } = useAuth()
console.log(user?.role) // 'admin' | 'viewer' | 'editor'
```

### Check if User is Admin
```typescript
const { isAdmin } = useAuth()
if (isAdmin) { /* show admin features */ }
```

### Change User Role (Manual DB)
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

## Security Checklist

- [ ] Changed `JWT_SECRET` from default value
- [ ] Set strong Supabase API keys
- [ ] Deleted/secured `/api/setup/init-admin` endpoint
- [ ] Enabled HTTPS for production
- [ ] Set secure cookie flags for tokens
- [ ] Enable rate limiting on auth endpoints
- [ ] Implement brute force protection
- [ ] Add email verification for signups

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid email or password" | Verify credentials, admin user created |
| Admin redirects to /accounts | Check user role is 'admin' in database |
| Token errors on reload | Check JWT_SECRET is consistent |
| CORS errors | Verify NEXT_PUBLIC_SUPABASE_URL is correct |
| 500 error on login | Check Supabase connection and env vars |
| Admin dashboard blank | Check console logs, role-based access |

## Support Docs

- **ADMIN_SETUP.md** - Detailed admin setup guide
- **QUICKSTART_ADMIN.md** - Quick start reference
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **COMPLETION_REPORT.md** - What was fixed and why

---
Last updated: 2026-05-02
