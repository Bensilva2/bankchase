# BankChase Hybrid Architecture: PostgreSQL + MongoDB

## Overview

BankChase uses a **hybrid database architecture** combining the strengths of both PostgreSQL and MongoDB:

- **PostgreSQL (via Supabase)**: Structured relational data, RBAC, user authentication, audit logs
- **MongoDB**: Flexible document storage, notifications, user preferences, transaction analytics, device tracking

This approach provides the best of both worlds: ACID compliance and structured data integrity with PostgreSQL, plus schema flexibility and horizontal scalability with MongoDB.

---

## Architecture Design

### PostgreSQL (Supabase) - Responsibility

**Handles:**
- User authentication and profiles (RBAC)
- Account management and zero-balance verification
- 2FA codes and password reset tokens
- Admin audit logs (immutable, 90-day retention)
- Login history (for security verification)

**Why PostgreSQL:**
- ACID transactions
- Role-Based Access Control (RLS)
- Strong data relationships
- Perfect for regulatory compliance
- Immutable audit trails

### MongoDB - Responsibility

**Handles:**
- User notifications (with TTL auto-expiration)
- User preferences and settings
- Transaction history (detailed records)
- Transaction analytics (monthly summaries)
- Device management and tracking
- Application audit logs (with TTL)

**Why MongoDB:**
- Flexible schema (preferences can vary per user)
- Efficient document queries
- Built-in TTL (auto-deletion of expired data)
- Easy horizontal scaling
- Better for high-volume transaction logs

---

## MongoDB Collections

### 1. notifications

Stores user notifications with automatic expiration.

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,              // UUID from PostgreSQL
  type: 'transaction' | 'security' | 'reward' | 'alert' | 'system',
  title: string,
  message: string,
  read: boolean,
  data: {},                    // Additional data
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date             // TTL index - auto-deletes after 30 days
}
```

**Indexes:**
- `{userId: 1, createdAt: -1}` - User notification history
- `{read: 1}` - Filter unread notifications
- `{expiresAt: 1}` - TTL index (auto-delete)

**Use Cases:**
- Transaction confirmations
- Security alerts
- Reward notifications
- System maintenance notices

---

### 2. preferences

User settings and preferences.

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,              // Unique constraint
  theme: 'light' | 'dark' | 'system',
  language: string,
  currency: string,
  timezone: string,
  dateFormat: string,
  notifications: {
    email: boolean,
    sms: boolean,
    push: boolean,
    frequency: 'realtime' | 'daily' | 'weekly'
  },
  twoFAMethod: 'sms' | 'email' | 'authenticator' | null,
  lastLogin: Date,
  loginHistory: [{
    timestamp: Date,
    ip: string,
    device: string,
    status: 'success' | 'failed'
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{userId: 1}` - Unique user preferences

---

### 3. transactions

Detailed transaction records.

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,              // UUID from PostgreSQL
  accountId: string,           // UUID from PostgreSQL accounts
  type: 'debit' | 'credit' | 'transfer' | 'withdrawal' | 'deposit',
  amount: number,
  currency: string,
  description: string,
  recipient: {
    accountNumber: string,
    accountHolder: string,
    bankName: string
  },
  metadata: {},
  status: 'pending' | 'completed' | 'failed' | 'reversed',
  createdAt: Date,
  completedAt: Date,
  failureReason: string
}
```

**Indexes:**
- `{userId: 1, createdAt: -1}` - User transaction history
- `{accountId: 1, status: 1}` - Account transactions by status
- `{type: 1}` - Transactions by type

**Use Cases:**
- Transaction history (10+ years)
- High-volume queries
- Analytics and reporting
- Customer-facing statements

---

### 4. analytics

Monthly transaction summaries (pre-computed for performance).

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,
  month: string,               // "YYYY-MM"
  totalIncome: number,
  totalExpense: number,
  categoryBreakdown: {
    'groceries': 1500,
    'utilities': 200,
    'dining': 450,
    ...
  },
  merchantCount: number,
  averageTransactionAmount: number,
  largestTransaction: number,
  transactionCount: number,
  updatedAt: Date
}
```

**Indexes:**
- `{userId: 1, month: 1}` - Unique user/month combination

---

### 5. devices

Registered devices for user accounts.

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,
  deviceId: string,
  deviceName: string,
  deviceType: 'mobile' | 'tablet' | 'desktop',
  osType: string,
  osVersion: string,
  browserType: string,
  browserVersion: string,
  ipAddress: string,
  userAgent: string,
  lastActive: Date,
  isActive: boolean,
  isTrusted: boolean,
  createdAt: Date
}
```

**Indexes:**
- `{userId: 1}` - User devices
- `{deviceId: 1}` - Unique device lookup
- `{lastActive: 1}` - Recently active devices

**Use Cases:**
- Multi-device login tracking
- Device trust management
- Security notifications
- "Sign out all other devices"

---

### 6. auditLogs

Application-level audit trail (separate from PostgreSQL admin logs).

**Schema:**
```typescript
{
  _id: ObjectId,
  userId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  changes: {},
  ipAddress: string,
  userAgent: string,
  status: 'success' | 'failure',
  errorMessage: string,
  createdAt: Date              // TTL: 90 days
}
```

**Indexes:**
- `{userId: 1, createdAt: -1}` - User action history
- `{resourceType: 1, resourceId: 1}` - Resource change history
- `{createdAt: 1}` - TTL index (auto-delete after 90 days)

---

## Setup Instructions

### 1. Create MongoDB Cluster

**Option A: MongoDB Atlas (Recommended for Production)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 tier for development)
3. Create database user with strong password
4. Add IP address to network access
5. Copy connection string

**Option B: Local MongoDB (Development)**

```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Linux
sudo apt-get install mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community

# Start service
mongod
```

### 2. Set Environment Variable

```bash
# In Vercel environment variables or .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bankchase?retryWrites=true&w=majority

# Or for local development
MONGODB_URI=mongodb://localhost:27017/bankchase
```

### 3. Initialize Collections

```typescript
import { initializeCollections } from '@/lib/mongodb/collections';

// Call once on application startup
await initializeCollections();
```

---

## Usage Examples

### Create Notification

```typescript
import { createNotification } from '@/lib/mongodb/operations';

const notificationId = await createNotification(userId, {
  type: 'transaction',
  title: 'Transfer Complete',
  message: 'Successfully transferred $500.00',
  read: false,
});
```

### Get User Notifications

```typescript
import { getUserNotifications } from '@/lib/mongodb/operations';

const notifications = await getUserNotifications(userId, 50);
// Returns: UserNotification[]
```

### Record Transaction

```typescript
import { recordTransaction } from '@/lib/mongodb/operations';

const transactionId = await recordTransaction(userId, {
  accountId: accountUUID,
  type: 'transfer',
  amount: 500.00,
  currency: 'USD',
  description: 'Transfer to John Doe',
  recipient: {
    accountNumber: '1234567890',
    accountHolder: 'John Doe',
    bankName: 'Chase Bank'
  },
  status: 'pending',
  createdAt: new Date(),
});
```

### Update Transaction Status

```typescript
import { updateTransactionStatus } from '@/lib/mongodb/operations';

await updateTransactionStatus(
  transactionId,
  userId,
  'completed',
  { completedTime: new Date() }
);
```

### Register Device

```typescript
import { registerDevice } from '@/lib/mongodb/operations';

const deviceId = await registerDevice(userId, {
  deviceId: 'device-uuid',
  deviceName: 'iPhone 14',
  deviceType: 'mobile',
  osType: 'iOS',
  osVersion: '17.0',
  browserType: 'Safari',
  browserVersion: '17.0',
  ipAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0...',
  lastActive: new Date(),
  isActive: true,
  isTrusted: false,
  createdAt: new Date(),
});
```

---

## Data Flow

### New User Registration

```
1. User Registration
   ↓
2. PostgreSQL (Supabase):
   - Create user with 'customer' role
   - Create account with zero balance
   - Hash password with bcrypt
   ↓
3. MongoDB:
   - Create preferences document
   - Set default notification settings
   ↓
4. Return session token
```

### Transaction Processing

```
1. User initiates transfer
   ↓
2. PostgreSQL: Validate account balance and permissions
   ↓
3. MongoDB: Record pending transaction
   ↓
4. Process transfer (payment processor)
   ↓
5. MongoDB: Update transaction status
   ↓
6. MongoDB: Create notification
   ↓
7. PostgreSQL: Update account balance
   ↓
8. PostgreSQL admin_audit_logs: Log the transaction
```

### User Login

```
1. User submits credentials
   ↓
2. PostgreSQL: Fetch user and verify password
   ↓
3. Generate 2FA code (store in PostgreSQL)
   ↓
4. User enters 2FA code
   ↓
5. PostgreSQL: Validate 2FA code
   ↓
6. MongoDB: Update lastLogin and loginHistory in preferences
   ↓
7. MongoDB: Register device (if new device)
   ↓
8. MongoDB: Create login notification
   ↓
9. Return JWT token
```

---

## Performance Considerations

### MongoDB Indexing Strategy

- All queries use indexed fields
- Compound indexes for common multi-field queries
- TTL indexes for automatic data cleanup
- No full collection scans

### Query Optimization

**Good:**
```typescript
// Uses indexes
db.transactions.find({ userId: 1, createdAt: -1 })
db.notifications.findOne({ userId: 1, read: 1 })
```

**Bad:**
```typescript
// No index, full collection scan
db.transactions.find({ description: "Transfer" })
db.preferences.find({ currency: "USD" })
```

### Connection Pooling

- MongoDB driver uses connection pooling (min: 2, max: 10)
- Vercel's `attachDatabasePool()` ensures proper cleanup
- Connections reused across requests

---

## Monitoring & Maintenance

### Health Check Endpoint

```typescript
GET /api/health/mongodb
// Returns: { status: 'ok' } or { status: 'error' }
```

### MongoDB Atlas Monitoring

1. Go to Atlas Dashboard
2. Monitor:
   - Connection count
   - Throughput (reads/writes per sec)
   - Network I/O
   - Operation latency

### Backup Strategy

**MongoDB Atlas:**
- Automatic daily backups (30-day retention)
- Point-in-time recovery available
- Easy restore functionality

**PostgreSQL (Supabase):**
- Automated daily backups
- Point-in-time recovery
- Replication enabled

---

## Cost Optimization

### MongoDB Atlas Pricing

- **Free Tier (M0)**: Shared instance, 512 MB storage, OK for dev/test
- **Paid Tier (M2+)**: Dedicated cluster, auto-scaling, production-ready
- **Costs**: Start from ~$9/month (M2)

### PostgreSQL (Supabase)

- **Free Tier**: 500 MB database, OK for small projects
- **Pro Tier**: $25/month, unlimited databases
- **Scaling**: Auto-scales with usage

### Optimization Tips

1. **Use TTL indexes** - Auto-delete old notifications and logs
2. **Archive old data** - Move 1+ year old transactions to cold storage
3. **Compress uploads** - Store notification images compressed
4. **Batch writes** - Insert multiple documents in single operation

---

## Troubleshooting

### Connection Errors

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
1. Verify MongoDB is running (`mongod`)
2. Check connection string in `.env`
3. Verify IP is whitelisted (Atlas)
4. Check firewall rules

### Query Timeouts

**Error:** `MongoServerSelectionError: Server selection timed out`

**Solution:**
1. Increase `serverSelectionTimeoutMS` (default 5000)
2. Check MongoDB Atlas cluster status
3. Verify network connectivity
4. Review slow queries in Atlas monitoring

### Duplicate Key Errors

**Error:** `E11000 duplicate key error`

**Solution:**
1. Unique indexes: `userId` in preferences
2. Don't insert without checking for existing record
3. Use `updateOne` with `upsert: true` instead

---

## Security Best Practices

1. **Never expose connection string** - Keep in `.env`
2. **Use IP whitelist** - Only allow Vercel IPs
3. **Enable authentication** - Require username/password
4. **Use TLS** - MongoDB Atlas has it by default
5. **Rotate credentials** - Change passwords regularly
6. **Monitor access** - Review Atlas activity logs
7. **Encrypt sensitive data** - Use field-level encryption for sensitive fields
8. **Access control** - Only admin user needs full access

---

## Migration Path

### Phase 1: Notifications (Week 1)
- Move notifications from Supabase to MongoDB
- Implement TTL cleanup
- Test notification delivery

### Phase 2: Preferences & Analytics (Week 2)
- Move user preferences to MongoDB
- Implement analytics aggregation
- Create reporting dashboards

### Phase 3: Full Transaction History (Week 3)
- Archive transactions to MongoDB
- Implement transaction search
- Create advanced reporting

### Phase 4: Optimization (Week 4)
- Archive old data
- Optimize indexes
- Scale for production load

---

## API Reference

See `/lib/mongodb/operations.ts` for complete API documentation.

**Key Functions:**
- `getMongoClient()` - Get MongoDB connection
- `initializeCollections()` - Create collections and indexes
- `createNotification()` - Add notification
- `recordTransaction()` - Record transaction
- `registerDevice()` - Register user device
- `recordAuditLog()` - Log user action

---

**Status:** Production Ready
**Last Updated:** 2024
**Support:** See troubleshooting section or contact engineering team
