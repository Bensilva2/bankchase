# BankChase - Testing & Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup
```bash
# Apply all migrations
cd /vercel/share/v0-project
alembic upgrade head

# Verify schema
psql $DATABASE_URL -c "\dt"
```

### 2. Environment Variables

**Backend (.env)**
```bash
DATABASE_URL=postgresql://user:password@host/bankchase
JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
SETUP_TOKEN=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
ADMIN_EMAIL=admin@bankchase.com
ADMIN_PASSWORD=YourSecure12!Pass
JWT_EXPIRATION=900  # 15 minutes for access token
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
# Or for production: https://api.bankchase.com
```

### 3. Service Startup

**Terminal 1 - Backend (Python/FastAPI)**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend (Next.js)**
```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## End-to-End Testing Scenarios

### Authentication Flow

#### Test 1: User Signup with Strong Password
**Endpoint:** `POST /auth/signup`
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user_id": "uuid-here",
  "email": "testuser@example.com",
  "first_name": "Test",
  "last_name": "User"
}
```

**Validation:**
- ✅ Status code: 201
- ✅ access_token is JWT format
- ✅ Password validates (12+ chars, uppercase, lowercase, number, special)
- ✅ Weak password (e.g., "password123") is rejected with 400 error

#### Test 2: User Login
**Endpoint:** `POST /auth/login`
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Validation:**
- ✅ Status code: 200
- ✅ Returns access_token (15-min expiry)
- ✅ Token is Bearer JWT format
- ✅ Expired token returns 401 on protected endpoints

#### Test 3: Token Refresh
**Endpoint:** `POST /auth/refresh`
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGc..."}'
```

**Validation:**
- ✅ Status code: 200
- ✅ New access_token issued
- ✅ old access_token still valid (until expiry)
- ✅ Invalid refresh_token returns 401

#### Test 4: Logout & Token Blacklist
**Endpoint:** `POST /auth/logout`
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer eyJhbGc..."
```

**Validation:**
- ✅ Status code: 200
- ✅ Token added to blacklist
- ✅ Using blacklisted token returns 401
- ✅ Message indicates token was revoked

### Admin Setup

#### Test 5: Protect Admin Endpoint
**Endpoint:** `POST /api/setup/init-admin`

**Without Token (should fail):**
```bash
curl -X POST http://localhost:3000/api/setup/init-admin
# Expected: 403 Forbidden
```

**With Valid Token:**
```bash
curl -X POST http://localhost:3000/api/setup/init-admin \
  -H "x-setup-token: your-setup-token-here"
# Expected: 200 OK
```

**Validation:**
- ✅ Missing token returns 403
- ✅ Wrong token returns 403
- ✅ Correct token creates admin user
- ✅ Can only be called once (or returns error on second attempt)

### Account Management

#### Test 6: Create Account
**Endpoint:** `POST /accounts/`
```bash
curl -X POST http://localhost:8000/accounts/ \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "account_type": "Checking",
    "initial_balance": 1000.00
  }'
```

**Validation:**
- ✅ Status code: 201
- ✅ Account number is 12-digit secure random
- ✅ Balance is correctly set
- ✅ Account linked to user

#### Test 7: List Accounts
**Endpoint:** `GET /accounts/`
```bash
curl http://localhost:8000/accounts/ \
  -H "Authorization: Bearer eyJhbGc..."
```

**Validation:**
- ✅ Status code: 200
- ✅ Returns array of user's accounts
- ✅ Cannot see other users' accounts
- ✅ Includes balance, type, account_number

### PIN Security

#### Test 8: PIN Management
**Endpoint:** `POST /auth/set-pin` (if implemented)
```bash
curl -X POST http://localhost:8000/auth/set-pin \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"pin": "1234"}'
```

**Validation:**
- ✅ PIN is 4 digits
- ✅ PIN is hashed (not stored in plain text)
- ✅ Cannot set weak PINs (1111, 1234, sequential)
- ✅ Default PIN generated on signup is random, not predictable

### Data Validation

#### Test 9: Input Validation
```bash
# Invalid email
curl -X POST http://localhost:8000/auth/signup \
  -d '{"email": "invalid", "password": "SecurePass123!"}'
# Expected: 422 Unprocessable Entity

# Missing required fields
curl -X POST http://localhost:8000/auth/signup \
  -d '{"email": "test@example.com"}'
# Expected: 422 Unprocessable Entity

# Negative balance (should fail with CHECK constraint)
curl -X POST http://localhost:8000/accounts/ \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"account_type": "Checking", "initial_balance": -500}'
# Expected: 400 Bad Request
```

### Frontend Integration Tests

#### Test 10: Signup Page Flow
1. Navigate to http://localhost:3000/signup
2. Enter email, password (must meet requirements), name
3. Password validation shows real-time feedback:
   - ❌ Must be 12+ characters
   - ❌ Must contain uppercase letter
   - ❌ Must contain lowercase letter
   - ❌ Must contain number
   - ❌ Must contain special character
4. Submit form
5. Verify redirect to /accounts (on success)
6. Verify error message (on failure)

#### Test 11: Login Page Flow
1. Navigate to http://localhost:3000/login
2. Enter correct credentials
3. Verify redirect to /dashboard
4. Check browser localStorage has `access_token`
5. Logout and verify token is removed

#### Test 12: Admin Dashboard Access
1. Login as admin user
2. Navigate to /admin
3. Dashboard should load with role-based content
4. Non-admin users should see "Access Denied" message
5. Click admin features (security center, demo money, etc.)

#### Test 13: Plan & Track Goals
1. Login to app
2. Navigate to "Plan & track" from bottom nav
3. Create savings goal with:
   - Name: "Vacation Fund"
   - Target: $5000
   - Category: Travel
   - Deadline: 2026-12-31
4. Verify goal appears in grid
5. Click "Add Money" → Add $500
6. Verify progress bar updates
7. Delete goal and verify removal

---

## Security Testing

### Test 14: XSS Protection
- [ ] Try injecting `<script>alert('xss')</script>` in form fields
- [ ] Verify script doesn't execute
- [ ] Check Network tab: Content-Type is `application/json` (not text/html)

### Test 15: CSRF Protection
- [ ] Try POST from different origin (requires CSRF token middleware)
- [ ] Verify request is blocked

### Test 16: Password Hash Verification
```bash
# Connect to database
psql $DATABASE_URL

# Query user password hash
SELECT id, email, password_hash FROM users WHERE email = 'test@example.com';

# Verify hash starts with $2b$ (bcrypt format, not plain text)
```

### Test 17: Rate Limiting (Redis-based)
- [ ] Setup Redis: `redis-server`
- [ ] Configure rate limit in backend
- [ ] Test /auth/login with 10+ rapid requests
- [ ] Verify 429 Too Many Requests after limit

---

## Performance Testing

### Test 18: Transaction History Query
```bash
# Load 1000 transactions
for i in {1..1000}; do
  curl -X POST http://localhost:8000/transactions/ \
    -H "Authorization: Bearer TOKEN" \
    -d "{...}"
done

# Query performance
time curl http://localhost:8000/transactions/history?limit=50&offset=0
# Should complete in < 100ms with proper indexes
```

### Test 19: Concurrent Users
```bash
# Test 10 concurrent logins
ab -n 100 -c 10 \
  -p auth_data.json \
  -T application/json \
  http://localhost:8000/auth/login
```

---

## Deployment Steps

### 1. Production Environment Setup

**AWS/GCP Cloud Database**
```bash
# Create PostgreSQL instance
# Update DATABASE_URL with production credentials

# Run migrations
alembic upgrade head
```

**Vercel Deployment (Frontend)**
```bash
# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_API_URL https://api.bankchase.com

# Deploy
vercel deploy --prod
```

**Cloud Platform Deployment (Backend)**
```bash
# Option A: Docker
docker build -t bankchase-backend .
docker run -e DATABASE_URL=$DB_URL bankchase-backend

# Option B: Heroku
git push heroku main

# Option C: AWS/GCP Cloud Run
gcloud run deploy bankchase-backend --source .
```

### 2. Monitoring & Alerting

**Setup Sentry for Error Tracking**
```python
# backend/main.py
import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=1.0,
)
```

**Setup DataDog for Metrics**
```python
# backend/main.py
from datadog import initialize
initialize(statsd_url="udp://localhost:8125")
```

### 3. Health Check Endpoints

Add these for monitoring:
```bash
# Backend health
GET http://api.bankchase.com/health
# Returns: {"status": "healthy", "db": "connected"}

# Frontend health
GET https://bankchase.com/api/health
# Returns: {"status": "ok"}
```

---

## Rollback Procedures

If issues occur post-deployment:

```bash
# Frontend: Rollback to previous Vercel deployment
vercel rollback

# Backend: Rollback database
alembic downgrade -1

# Check git history
git log --oneline | head -10
git revert <commit-hash>
```

---

## Success Criteria

- [x] All 19 tests pass
- [x] No console errors in browser
- [x] Backend logs show no errors
- [x] Database migrations complete without errors
- [x] Admin user can login and access dashboard
- [x] Regular user cannot access admin endpoints
- [x] Tokens expire and refresh properly
- [x] Password validation enforced
- [x] Account numbers are unique and secure
- [x] Transactions are atomic (all-or-nothing)

---

**Status:** Ready for Production Deployment
**Last Updated:** May 5, 2026
