# START HERE - Chase Bank Voice Agent Platform

## Quick Start (5 Minutes)

### Step 1: Start the Backend
```bash
cd backend
uv run main.py
# or
uvicorn main:app --reload --port 8000
```

### Step 2: Start the Frontend
```bash
npm run dev
```

### Step 3: Login
Open http://localhost:3000

You'll be automatically redirected to the login page.

**Demo Credentials:**
```
Email: demo@chase.com
Password: demo123
```

## What's Changed

### Authentication Flow
- ✅ No retry loops
- ✅ No verification retries
- ✅ Simple direct login
- ✅ Instant dashboard load with cached data

### Key Files

| File | Purpose |
|------|---------|
| `/app/page.tsx` | Redirects to /login |
| `/app/login/page.tsx` | Clean login form |
| `/app/dashboard/page.tsx` | Protected dashboard |
| `/lib/auth-context.tsx` | Auth provider (no retries) |
| `/hooks/useFetch.ts` | Data fetching with caching |
| `/app/api/auth/login/route.ts` | Login endpoint |
| `/app/api/auth/verify/route.ts` | Token verify endpoint |
| `/app/api/accounts/route.ts` | Get user accounts |

## How It Works

```
1. User visits http://localhost:3000
2. Redirected to /login (instant)
3. Enters credentials
4. POST /api/auth/login → Backend auth
5. Success: Token saved → Redirect to /dashboard
6. Dashboard loads with cached accounts
7. User can sign out anytime
```

## No Retry Logic

All retry loops have been removed:
- ❌ Token verification retries
- ❌ Exponential backoff
- ❌ Multiple API attempts
- ❌ Complex error recovery

Each request has a simple timeout (3-5 seconds) and fails cleanly on error.

## Features

### Login Page
- Email/password form
- Loading state
- Error messages
- Demo credentials display
- Redirect to signup

### Dashboard
- Total balance display
- Account cards with balances
- Demo account badge
- Quick action buttons
- Sign out button

### Data Caching
- Accounts cached for 2 minutes
- Automatic revalidation
- No redundant API calls
- Fresh data on demand

## Troubleshooting

### Backend Connection Error
```
If you see: "Login service timeout"
1. Make sure backend is running at http://localhost:8000
2. Check NEXT_PUBLIC_API_URL in .env.local
3. Restart both servers
```

### Login Not Working
```
1. Check email format (should be valid email)
2. Verify backend is responding: curl http://localhost:8000/health
3. Check /app/api/auth/login/route.ts for errors
```

### Dashboard Not Loading
```
1. Check if token is saved: localStorage.getItem('access_token')
2. Verify accounts endpoint: curl -H "Authorization: Bearer TOKEN" http://localhost:8000/accounts
3. Check browser console for errors
```

## Architecture

```
Frontend (Next.js 15)
├── Pages
│   ├── /login - Login form
│   ├── /dashboard - Protected dashboard
│   └── / - Redirect to /login
├── Components
│   └── Various UI components
├── Hooks
│   └── useFetch - Data fetching with cache
├── API Routes
│   ├── /api/auth/login - Login handler
│   ├── /api/auth/verify - Token verify
│   └── /api/accounts - Get accounts
└── Context
    └── auth-context - Auth state management

Backend (FastAPI)
├── /auth/login - Authenticate user
├── /auth/verify - Verify token
├── /accounts - Get user accounts
└── ... other endpoints
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Production Deployment

See `PRODUCTION_DEPLOYMENT.md` for:
- Vercel frontend deployment
- Backend deployment options
- Environment configuration
- Security checklist

## Support

- **Documentation**: See `README.md`
- **Integration Details**: See `INTEGRATION_COMPLETE.md`
- **Full Setup**: See `PRODUCTION_DEPLOYMENT.md`

---

**Ready to go!** Start the backend, run `npm run dev`, and visit http://localhost:3000
