# BankChase Authentication System

## Overview
The authentication system provides sign-in and sign-up functionality for the BankChase application with proper error handling and session management.

## Features

### Sign-In
- **Endpoint**: `POST /api/auth/sign-in`
- **Demo Credentials**:
  - Email: `demo@bankchase.com`
  - Password: `DemoPassword123!`
- **Response**: User object with session cookie
- **Error Handling**: Invalid credentials return 401 with descriptive error

### Sign-Up
- **Endpoint**: `POST /api/auth/sign-up`
- **Requirements**:
  - Email: Valid format (user@domain.com)
  - Password: Minimum 8 characters
  - Name: Optional (defaults to email username)
- **Response**: Created user object with session cookie
- **Validation**: Returns 400 for invalid inputs

## API Documentation

### Sign-In Request
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@bankchase.com",
    "password": "DemoPassword123!"
  }'
```

### Sign-In Response (Success)
```json
{
  "success": true,
  "user": {
    "id": "demo_user_1",
    "email": "demo@bankchase.com",
    "name": "Demo User"
  },
  "message": "Signed in successfully"
}
```

### Sign-In Response (Error)
```json
{
  "error": "Invalid email or password"
}
```

### Sign-Up Request
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "New User"
  }'
```

### Sign-Up Response (Success)
```json
{
  "success": true,
  "user": {
    "id": "user_abc123def",
    "email": "newuser@example.com",
    "name": "New User",
    "createdAt": "2026-06-09T04:32:43.083Z"
  },
  "message": "Account created successfully"
}
```

### Sign-Up Response (Error)
```json
{
  "error": "Password must be at least 8 characters"
}
```

## Error Codes

| Code | Scenario | Error Message |
|------|----------|---------------|
| 400 | Missing email or password | "Email and password are required" |
| 400 | Password too short (< 8 chars) | "Password must be at least 8 characters" |
| 400 | Invalid email format | "Invalid email format" |
| 401 | Wrong credentials | "Invalid email or password" |
| 500 | Server error | "Failed to create account" / "Failed to sign in" |

## Frontend Components

### AuthForm Component
Located at `components/auth-form.tsx`

**Props**:
- `mode`: 'sign-in' | 'sign-up'

**Features**:
- Email validation
- Password validation
- Name field (sign-up only)
- Loading state
- Error display
- Link to switch between sign-in/sign-up

**Usage**:
```tsx
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() {
  return <AuthForm mode="sign-in" />
}
```

### AuthClient
Located at `lib/auth-client.ts`

**Methods**:
- `signUp.email(credentials)` - Create new account
- `signIn.email(credentials)` - Sign in with credentials
- `signOut()` - Sign out user

**Usage**:
```tsx
const response = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123'
})

if (response.error) {
  console.error(response.error.message)
} else {
  // Signed in successfully
}
```

## Session Management

### Cookie Settings
- **Name**: `auth_token`
- **Type**: HTTP-only (secure)
- **Duration**: 7 days
- **SameSite**: Lax
- **Secure**: Only in production

### Cookie Data Structure
```json
{
  "id": "user_unique_id",
  "email": "user@example.com",
  "name": "User Name",
  "loginTime": "2026-06-09T04:32:43.083Z"
}
```

## Pages

### Sign-In Page
- **URL**: `/sign-in`
- **Component**: `app/sign-in/page.tsx`
- **Features**: Email/password form, link to sign-up

### Sign-Up Page
- **URL**: `/sign-up`
- **Component**: `app/sign-up/page.tsx`
- **Features**: Email/password/name form, link to sign-in

## Testing

### Test Sign-In
```bash
# Valid credentials
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bankchase.com","password":"DemoPassword123!"}'

# Invalid credentials
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@bankchase.com","password":"wrong"}'
```

### Test Sign-Up
```bash
# Valid sign-up
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

# Invalid password
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"short"}'
```

## Future Enhancements

1. **Database Integration**: Store users in database instead of demo data
2. **Password Hashing**: Implement bcrypt for password security
3. **Email Verification**: Send confirmation emails to new users
4. **2FA Support**: Add two-factor authentication
5. **OAuth Integration**: Google, GitHub, Microsoft login
6. **Rate Limiting**: Prevent brute force attacks
7. **Session Refresh**: Implement token refresh mechanism
8. **Remember Me**: Extended session option

## Security Considerations

- Passwords are validated for minimum length
- HTTP-only cookies prevent XSS attacks
- CORS configured properly in production
- Error messages don't reveal user existence
- Input validation on both client and server
- HTTPS enforced in production

## Troubleshooting

### "Network error" message
- Check if API endpoint is accessible
- Verify Content-Type header is set to "application/json"
- Check browser console for detailed errors

### Sign-in always fails
- Verify demo credentials: `demo@bankchase.com` / `DemoPassword123!`
- Check that API endpoint returns proper error messages

### Session not persisting
- Verify cookies are enabled in browser
- Check cookie settings in browser dev tools
- Ensure auth_token cookie is being set

## Support

For authentication-related issues, check:
1. API endpoint responses using curl/Postman
2. Browser console for client-side errors
3. Server logs for backend errors
4. Cookie settings in browser dev tools
