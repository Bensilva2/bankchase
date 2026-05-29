# Production Banking Database Schema

This document outlines the PostgreSQL schema required for production banking operations with strict transaction integrity and double-entry ledger compliance.

## Core Principles

1. **Idempotency** - Each transfer has a unique key to prevent duplicate processing
2. **Double-Entry Ledger** - Every transaction creates both a debit and credit entry for accounting accuracy
3. **Transaction Isolation** - Uses serializable isolation level for financial operations
4. **Audit Trail** - All transactions timestamped and immutable

## Database Schema

### Enums

```sql
-- Transfer states during processing lifecycle
CREATE TYPE transfer_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Ledger entry direction (debit/credit)
CREATE TYPE direction_type AS ENUM ('debit', 'credit');
```

### 1. Accounts Table

Stores customer account information with current balance.

```sql
CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) UNIQUE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    phone_number VARCHAR(15) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_account_number ON accounts(account_number);
```

### 2. Master Transactions Ledger

Central transaction registry with idempotency protection and external provider tracking.

```sql
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    sender_account_id UUID REFERENCES accounts(account_id),
    receiver_account_number VARCHAR(34) NOT NULL,
    receiver_bank_code VARCHAR(11) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status transfer_status NOT NULL DEFAULT 'pending',
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_idempotency ON transactions(idempotency_key);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_sender ON transactions(sender_account_id);
```

### 3. Double-Entry Audit Logs

Immutable ledger ensuring accounting integrity: every debit has a matching credit.

```sql
CREATE TABLE ledger_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(transaction_id),
    account_id UUID REFERENCES accounts(account_id),
    direction direction_type NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ledger_transaction ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
```

## Transaction Processing Flow

### 1. Idempotency Check
Before processing, verify the `idempotency_key` doesn't already exist.

### 2. Account Locking
Lock the sender's account row with `FOR UPDATE` during the transaction.

### 3. Balance Validation
Check sufficient funds: `current_balance >= transfer_amount`

### 4. Debit Operation
```sql
UPDATE accounts SET balance = balance - $1 WHERE account_id = $2
```

### 5. Ledger Entries (Double-Entry)
```sql
-- Debit entry
INSERT INTO ledger_entries (transaction_id, account_id, direction, amount)
VALUES ($1, $2, 'debit', $3)

-- Credit entry  
INSERT INTO ledger_entries (transaction_id, account_id, direction, amount)
VALUES ($1, $3, 'credit', $3)
```

### 6. Transaction Registration
```sql
INSERT INTO transactions (transaction_id, idempotency_key, sender_account_id, ...)
VALUES ($1, $2, $3, ...)
```

## Key Safety Features

### Serializable Isolation
All financial operations use `SERIALIZABLE` isolation level:

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
```

### Row-Level Locking
Prevent concurrent modifications:

```sql
SELECT account_id, balance FROM accounts WHERE account_id = $1 FOR UPDATE
```

### Webhook Signature Verification
Prevent webhook spoofing:

```go
mac := hmac.New(sha256.New, []byte(WebhookSigningSecret))
mac.Write(body)
expectedSignature := hex.EncodeToString(mac.Sum(nil))

if !hmac.Equal([]byte(receivedSignature), []byte(expectedSignature)) {
    return http.StatusUnauthorized
}
```

## Ledger Integrity Checks

### Verify Balanced Ledger
```sql
SELECT 
    SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END) as net_balance
FROM ledger_entries
WHERE transaction_id = $1
HAVING SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END) = 0
```

### Monthly Account Reconciliation
```sql
SELECT 
    account_id,
    SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) -
    SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as ledger_balance
FROM ledger_entries
GROUP BY account_id
```

## Deployment Checklist

- [ ] Database is in private subnet with no public access
- [ ] SSL/TLS enabled for all database connections
- [ ] CloudWatch logs configured to scrub sensitive data (phone numbers, balances)
- [ ] AWS Secrets Manager stores database credentials
- [ ] Regular automated backups with point-in-time recovery
- [ ] Read replicas for disaster recovery across availability zones
