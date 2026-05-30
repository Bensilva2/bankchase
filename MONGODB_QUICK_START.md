# MongoDB + PostgreSQL Quick Start

## 5-Minute Setup

### 1. Create MongoDB Atlas Cluster (2 min)

```bash
# Visit: https://www.mongodb.com/cloud/atlas
# 1. Sign up free
# 2. Create cluster (M0 free tier)
# 3. Create database user (username/password)
# 4. Copy connection string
```

### 2. Set Environment Variable (1 min)

```bash
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bankchase?retryWrites=true&w=majority
```

### 3. Start Development (1 min)

```bash
# Install MongoDB driver (already done, just verify)
npm install mongodb

# Start dev server
npm run dev

# Verify connection
curl http://localhost:3000/api/health/mongodb
# Expected: { status: 'ok' }
```

### 4. Test API (1 min)

```bash
# Create notification
curl -X POST http://localhost:3000/api/customer/notifications \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "type": "transaction",
    "title": "Transfer Complete",
    "message": "You transferred $500",
    "read": false
  }'

# Get notifications
curl -X GET http://localhost:3000/api/customer/notifications \
  -H "x-user-id: user-123"

# Record transaction
curl -X POST http://localhost:3000/api/customer/transactions \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "accountId": "account-uuid",
    "type": "transfer",
    "amount": 500,
    "currency": "USD",
    "description": "Transfer to John",
    "status": "completed"
  }'
```

---

## Architecture at a Glance

```
User Request
    ↓
Next.js API Route
    ├─ Supabase (PostgreSQL)     → Auth, RBAC, Accounts
    └─ MongoDB                   → Notifications, Transactions
    ↓
Response
```

### What Goes Where?

**PostgreSQL (Supabase):**
- User authentication
- Account structure
- RBAC roles
- Audit logs

**MongoDB:**
- Notifications
- Transactions
- Preferences
- Device tracking

---

## Common Tasks

### Add Notification to User

```typescript
import { createNotification } from '@/lib/mongodb/operations';

await createNotification(userId, {
  type: 'transaction',
  title: 'Transfer Complete',
  message: 'You transferred $500 to John Doe',
  read: false,
});
```

### Get User's Notifications

```typescript
import { getUserNotifications } from '@/lib/mongodb/operations';

const notifications = await getUserNotifications(userId, 50);
```

### Record Transaction

```typescript
import { recordTransaction } from '@/lib/mongodb/operations';

const transactionId = await recordTransaction(userId, {
  accountId: accountUUID,
  type: 'transfer',
  amount: 500,
  currency: 'USD',
  description: 'Transfer to John',
  status: 'completed',
  createdAt: new Date(),
});
```

### Register Device

```typescript
import { registerDevice } from '@/lib/mongodb/operations';

const deviceId = await registerDevice(userId, {
  deviceId: 'device-uuid',
  deviceName: 'iPhone 14',
  deviceType: 'mobile',
  osType: 'iOS',
  ipAddress: '203.0.113.42',
  lastActive: new Date(),
  isActive: true,
  isTrusted: false,
  createdAt: new Date(),
});
```

### Update User Preferences

```typescript
import { createOrUpdatePreferences } from '@/lib/mongodb/operations';

await createOrUpdatePreferences(userId, {
  theme: 'dark',
  language: 'en',
  currency: 'USD',
});
```

---

## Collections Overview

| Collection | TTL | Indexes | Use |
|-----------|-----|---------|-----|
| notifications | 30 days | userId, read | Alerts & updates |
| preferences | Never | userId | User settings |
| transactions | Never | userId, status, type | History & analytics |
| analytics | Never | userId, month | Reporting |
| devices | Never | userId, lastActive | Device mgmt |
| auditLogs | 90 days | userId, resourceType | Compliance |

---

## Development Workflow

### 1. Create API Route

```typescript
// app/api/customer/myfeature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { myMongoOperation } from '@/lib/mongodb/operations';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  const data = await myMongoOperation(userId);
  
  return NextResponse.json({ success: true, data });
}
```

### 2. Test with curl

```bash
curl -X GET http://localhost:3000/api/customer/myfeature \
  -H "x-user-id: test-user-id"
```

### 3. Use in Frontend

```typescript
const response = await fetch('/api/customer/myfeature', {
  headers: { 'x-user-id': currentUserId }
});
const { data } = await response.json();
```

---

## Troubleshooting

### MongoDB Connection Error

```
Error: MongoNetworkError: connect ECONNREFUSED
```

**Fix:**
1. Verify MONGODB_URI in .env.local
2. Check IP whitelisting (Atlas dashboard)
3. Verify cluster is running

### Duplicate Key Error

```
Error: E11000 duplicate key error collection: bankchase.preferences
```

**Fix:**
```typescript
// Use upsert instead of insert
await createOrUpdatePreferences(userId, data);
// Not: await insertOne(...)
```

### Slow Queries

**Check indexes:**
```javascript
db.notifications.getIndexes()
```

**Add missing index:**
```javascript
db.notifications.createIndex({ userId: 1, createdAt: -1 })
```

---

## Performance Tips

1. **Use indexes** - All queries use compound indexes
2. **Batch operations** - Insert multiple at once
3. **Use TTL** - Auto-delete old notifications (30 days)
4. **Limit queries** - Don't fetch all records, use pagination
5. **Monitor** - Check Atlas dashboard regularly

---

## Security

```typescript
// ✅ Good: Filter by authenticated user
const notifications = await getUserNotifications(userId);

// ❌ Bad: No user filtering (security risk)
const notifications = await collection.find({}).toArray();

// ✅ Good: Use parameterized queries (built-in to MongoDB driver)
await collection.find({ userId });

// ❌ Bad: String concatenation (vulnerable)
await collection.find({ userId: `${userInput}` });
```

---

## Deployment

### Vercel Environment Variables

```
MONGODB_URI=mongodb+srv://username:password@...
```

### MongoDB Atlas Whitelist

Add Vercel IP ranges to network access:
- `*.vercel.app` wildcard
- Or specific IPs from Vercel dashboard

### Health Check

```bash
curl https://bankchase.vercel.app/api/health/mongodb
```

---

## Next Steps

1. ✅ Set up MongoDB Atlas
2. ✅ Connect to dev environment
3. ✅ Test API routes
4. ✅ Build frontend components
5. ✅ Deploy to production

---

## Full Documentation

- **MongoDB Setup:** `docs/MONGODB_INTEGRATION.md`
- **Architecture:** `HYBRID_ARCHITECTURE_SUMMARY.md`
- **RBAC Guide:** `docs/RBAC_ARCHITECTURE.md`
- **Operations API:** `lib/mongodb/operations.ts`

---

**Happy coding! 🚀**
