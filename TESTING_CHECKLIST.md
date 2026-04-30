# Chase Bank Voice Agent - Testing Checklist

## Pre-Deployment Testing Guide

### 1. Authentication & Authorization
- [ ] User registration with email validation
- [ ] Email verification link works
- [ ] User login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Password reset flow completes successfully
- [ ] JWT tokens are properly signed and validated
- [ ] Token expiration works correctly (default 24h)
- [ ] Refresh token mechanism works
- [ ] RBAC: Admin user can access admin endpoints
- [ ] RBAC: Regular user cannot access admin endpoints
- [ ] RBAC: SuperAdmin has all permissions
- [ ] Session revocation works (logout)

### 2. Account Management
- [ ] Create new account with valid data
- [ ] Account creation fails with invalid account number
- [ ] Account creation fails with invalid routing number (bad checksum)
- [ ] Get account details returns correct balance
- [ ] List all user accounts works
- [ ] Account number validation (4-17 digits)
- [ ] Routing number validation (9 digits + checksum)

### 3. Transfers & Payments
- [ ] Send transfer to internal account with valid PIN
- [ ] Transfer fails with invalid PIN
- [ ] Transfer fails with missing PIN
- [ ] Transfer fails with weak PIN (e.g., "1111" or "1234")
- [ ] Transfer fails with incorrect PIN (3 attempts then 15-min lockout)
- [ ] Transfer to external bank succeeds
- [ ] Transfer with refund days set correctly
- [ ] Transfer amount validation (must be > 0)
- [ ] Receiving account balance updated correctly
- [ ] Sending account balance reduced correctly
- [ ] Transfer narration/description saved
- [ ] Concurrent transfers don't cause race conditions
- [ ] Large transfer amounts work (up to reasonable limit)

### 4. Rate Limiting
- [ ] /api/transfers/send rate limited to 10 per minute
- [ ] /api/admin/demo/transfer rate limited to 20 per minute
- [ ] Rate limit returns 429 status code
- [ ] Rate limit retry-after header present
- [ ] Rate limit resets after time window
- [ ] Rate limiting respects per-user basis

### 5. PIN Management
- [ ] User can set initial PIN
- [ ] PIN is hashed (bcrypt) in database
- [ ] PIN cannot be plaintext in logs/responses
- [ ] User cannot reuse same PIN (if required)
- [ ] PIN format validation (4-6 digits)
- [ ] PIN cannot be all same digits (1111 invalid)
- [ ] PIN cannot be sequential (1234 invalid)
- [ ] PIN lockout lasts exactly 15 minutes
- [ ] Failed attempt counter resets on successful validation
- [ ] Admin can reset user PIN lockout

### 6. Receipt Generation
- [ ] Receipt generated after successful transfer
- [ ] Receipt contains correct from/to accounts
- [ ] Receipt contains correct amount and currency
- [ ] Receipt contains transaction timestamp
- [ ] Receipt has unique receipt number
- [ ] Receipt shows before/after balance
- [ ] Receipt can be retrieved by receipt number
- [ ] Receipt stored in database
- [ ] Receipt returned in transfer response
- [ ] Concurrent receipts have unique numbers

### 7. Behavioral Detection & Drift Analysis
- [ ] Baseline established for user behavior (first 10 transactions)
- [ ] Drift detected on unusual activity
- [ ] Drift score calculated correctly
- [ ] High drift triggers alert/review
- [ ] Biometric validation required for high-drift transfers
- [ ] Liveness detection works for video submission
- [ ] Biometric data stored encrypted
- [ ] Behavioral metrics tracked (time, location, amount)

### 8. Transaction History
- [ ] List transactions for user shows all their transactions
- [ ] Filter by account works
- [ ] Filter by date range works
- [ ] Filter by amount works
- [ ] Pagination works (limit/offset)
- [ ] Transaction status shows correctly (pending/completed/failed)
- [ ] Debit and credit transactions both visible
- [ ] Transaction details include all required info

### 9. Webhook System
- [ ] Webhooks triggered on successful transfer
- [ ] Webhooks triggered on balance update
- [ ] Webhook retry mechanism works (exponential backoff)
- [ ] Failed webhooks retried up to max attempts
- [ ] Webhook events stored for audit trail
- [ ] Webhook delivery confirmation works
- [ ] Duplicate webhook events prevented
- [ ] Webhook signature verification works

### 10. Admin Features
- [ ] Admin can create demo account
- [ ] Admin can transfer demo money
- [ ] Admin can view all users
- [ ] Admin can view all transactions
- [ ] Admin can reset user PIN
- [ ] Admin can view webhook logs
- [ ] Admin cannot exceed rate limits (20/min)
- [ ] Admin bulk transfer works
- [ ] Bulk transfers create separate transactions

### 11. Demo Transfer System
- [ ] Demo source account has sufficient balance
- [ ] Demo transfers don't affect real money
- [ ] Demo transfers trigger webhooks
- [ ] Demo transfers appear in transaction history
- [ ] Demo transfers generate receipts
- [ ] Cannot transfer more than demo balance

### 12. Data Validation & Security
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked in data inputs
- [ ] CSRF tokens validated
- [ ] Input sanitization works for all fields
- [ ] File upload validation (if applicable)
- [ ] File size limits enforced
- [ ] Sensitive data not logged
- [ ] API responses don't expose sensitive info
- [ ] Error messages are generic (don't leak info)

### 13. Database & Migrations
- [ ] All migrations execute successfully
- [ ] Migration rollback works
- [ ] User tables created correctly
- [ ] Transaction tables created correctly
- [ ] Webhook tables created correctly
- [ ] Behavioral baseline tables created
- [ ] PIN/Receipt tables created
- [ ] Indexes created for performance
- [ ] Constraints enforced (unique, foreign keys)
- [ ] Transactions are ACID compliant

### 14. Performance Testing
- [ ] Transfer endpoint responds in < 500ms
- [ ] List transactions responds in < 200ms
- [ ] Load test with 100 concurrent transfers succeeds
- [ ] No database connection pool exhaustion
- [ ] Memory usage stable under load
- [ ] Response times consistent over time

### 15. Error Handling
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing token
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for non-existent resources
- [ ] 429 Too Many Requests for rate limit
- [ ] 500 Server Error with generic message
- [ ] 503 Service Unavailable during maintenance
- [ ] Error responses include proper status codes
- [ ] Error messages are helpful but safe

### 16. Logging & Audit
- [ ] All transfers logged with user/timestamp
- [ ] All admin actions logged
- [ ] Failed auth attempts logged
- [ ] PIN validation attempts logged
- [ ] Drift analysis results logged
- [ ] API errors logged with context
- [ ] Logs don't contain sensitive data
- [ ] Audit trail is immutable

### 17. Integration Tests
- [ ] End-to-end transfer flow works
- [ ] Multi-user concurrent transfers work
- [ ] Webhook delivery for transfers works
- [ ] Behavioral drift detection end-to-end works
- [ ] Admin bulk operations work
- [ ] Demo transfer system integration works

### 18. Documentation
- [ ] API endpoints documented
- [ ] API response schemas documented
- [ ] Error codes documented
- [ ] Setup instructions provided
- [ ] Deployment guide provided
- [ ] Database migration instructions provided
- [ ] Environment variables documented
- [ ] Rate limiting documented

## Load Testing Scenarios

### Scenario 1: Normal Operations
- 100 concurrent users
- 5 transfers per user
- Expected: All succeed within 1 second

### Scenario 2: Rate Limit Test
- 1 user making 20 transfers in 1 minute
- Expected: First 10 succeed, rest return 429

### Scenario 3: Large Transfers
- Transfers of $999,999.99 each
- Expected: All succeed (no artificial limits)

### Scenario 4: Behavioral Drift Test
- User transfers from different location/device
- User transfers at unusual time
- Expected: Drift score increases, triggers additional validation

## Browser Compatibility
- [ ] Chrome latest version
- [ ] Firefox latest version
- [ ] Safari latest version
- [ ] Edge latest version
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Security Audit Checklist
- [ ] All endpoints require authentication
- [ ] Sensitive endpoints require additional verification (PIN)
- [ ] Rate limiting prevents abuse
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] Secrets not in code/logs
- [ ] Database password secured
- [ ] API keys/tokens secured
- [ ] User data encrypted at rest
- [ ] User data encrypted in transit

## Deployment Verification
- [ ] Database connection works in production
- [ ] All environment variables set
- [ ] Rate limiter working (Redis/memory)
- [ ] Logging to proper location
- [ ] Webhooks can reach external services
- [ ] Email sending works (for verification)
- [ ] File uploads working (if applicable)
- [ ] Backups configured and tested
- [ ] Monitoring alerts configured
- [ ] Health check endpoint responding

## Post-Deployment Monitoring
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Monitor response times (target: < 500ms)
- [ ] Monitor database query performance
- [ ] Monitor webhook delivery success rate (target: > 99%)
- [ ] Monitor user authentication failures
- [ ] Monitor rate limit violations
- [ ] Monitor disk space usage
- [ ] Monitor CPU and memory usage
- [ ] Review logs for anomalies daily
- [ ] Set up alerts for critical errors

## Sign-Off
- [ ] QA Testing Complete: _____ Date: _____
- [ ] Security Review Complete: _____ Date: _____
- [ ] Performance Testing Complete: _____ Date: _____
- [ ] Production Ready Approval: _____ Date: _____
