-- Financial Transaction Ledger Schema
-- Enforces strict ACID compliance for banking operations
-- All transactions must be immutable once written

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Transaction States Enum
CREATE TYPE transaction_status AS ENUM (
  'pending',
  'validating',
  'processing',
  'completed',
  'failed',
  'rejected',
  'reversed'
);

-- Transaction Type Enum
CREATE TYPE transaction_type AS ENUM (
  'transfer',
  'deposit',
  'withdrawal',
  'fee',
  'interest',
  'refund'
);

-- Create the main transaction ledger table
-- This is the source of truth for all financial transactions
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_account_id VARCHAR(50) NOT NULL,
  receiver_account_id VARCHAR(50) NOT NULL,
  amount DECIMAL(19, 8) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  transaction_type transaction_type NOT NULL DEFAULT 'transfer',
  status transaction_status NOT NULL DEFAULT 'pending',
  
  -- Immutable core fields (set on creation, never modified)
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  idempotency_key VARCHAR(255),
  
  -- Status tracking
  validating_at TIMESTAMP WITH TIME ZONE,
  processing_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  reversed_at TIMESTAMP WITH TIME ZONE,
  
  -- External references
  provider_reference VARCHAR(255),
  provider_name VARCHAR(50),
  external_transaction_id VARCHAR(255),
  
  -- Error tracking
  failure_reason TEXT,
  failure_code VARCHAR(50),
  
  -- Additional metadata
  metadata JSONB,
  
  -- Versioning and compliance
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(transaction_id),
  UNIQUE(idempotency_key)
);

-- Create index on transaction_id for fast lookups
CREATE INDEX idx_transaction_ledger_txn_id ON transaction_ledger(transaction_id);
CREATE INDEX idx_transaction_ledger_sender ON transaction_ledger(sender_account_id);
CREATE INDEX idx_transaction_ledger_receiver ON transaction_ledger(receiver_account_id);
CREATE INDEX idx_transaction_ledger_status ON transaction_ledger(status);
CREATE INDEX idx_transaction_ledger_created_at ON transaction_ledger(created_at);
CREATE INDEX idx_transaction_ledger_provider_ref ON transaction_ledger(provider_reference);

-- Account Balance Table (denormalized for fast lookups)
CREATE TABLE IF NOT EXISTS account_balance (
  id BIGSERIAL PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL UNIQUE,
  balance DECIMAL(19, 8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  reserved_balance DECIMAL(19, 8) NOT NULL DEFAULT 0,
  
  last_transaction_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(account_id, currency)
);

CREATE INDEX idx_account_balance_account_id ON account_balance(account_id);

-- Immutable transaction audit trail
CREATE TABLE IF NOT EXISTS transaction_audit_log (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transaction_ledger(transaction_id),
  
  -- What changed
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Who/What changed it
  changed_by VARCHAR(100),
  change_type VARCHAR(50) NOT NULL, -- 'status_update', 'webhook_update', etc.
  
  -- When it happened
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Immutable metadata
  metadata JSONB
);

CREATE INDEX idx_transaction_audit_txn_id ON transaction_audit_log(transaction_id);
CREATE INDEX idx_transaction_audit_changed_at ON transaction_audit_log(changed_at);

-- Alert delivery tracking
CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transaction_ledger(transaction_id),
  
  alert_type VARCHAR(50) NOT NULL, -- 'sms', 'email', 'webhook'
  recipient VARCHAR(255) NOT NULL,
  
  status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'bounced', 'retry'
  retry_count INT DEFAULT 0 CHECK (retry_count >= 0),
  max_retries INT DEFAULT 3,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  response_code VARCHAR(20),
  response_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_delivery_txn_id ON alert_delivery_log(transaction_id);
CREATE INDEX idx_alert_delivery_status ON alert_delivery_log(status);
CREATE INDEX idx_alert_delivery_created_at ON alert_delivery_log(created_at);

-- Webhook event history
CREATE TABLE IF NOT EXISTS webhook_event_history (
  id BIGSERIAL PRIMARY KEY,
  webhook_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  transaction_id UUID REFERENCES transaction_ledger(transaction_id),
  
  payload JSONB NOT NULL,
  response_code INT,
  response_body TEXT,
  
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_event_webhook_id ON webhook_event_history(webhook_id);
CREATE INDEX idx_webhook_event_txn_id ON webhook_event_history(transaction_id);
CREATE INDEX idx_webhook_event_processed ON webhook_event_history(processed);
CREATE INDEX idx_webhook_event_created_at ON webhook_event_history(created_at);

-- Exchange rate history (for FX transactions)
CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id BIGSERIAL PRIMARY KEY,
  transaction_id UUID REFERENCES transaction_ledger(transaction_id),
  
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(19, 8) NOT NULL,
  
  source_provider VARCHAR(50),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exchange_rate_txn_id ON exchange_rate_history(transaction_id);
CREATE INDEX idx_exchange_rate_currency_pair ON exchange_rate_history(from_currency, to_currency);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction_ledger
CREATE TRIGGER update_transaction_ledger_updated_at
  BEFORE UPDATE ON transaction_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for account_balance
CREATE TRIGGER update_account_balance_updated_at
  BEFORE UPDATE ON account_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for alert_delivery_log
CREATE TRIGGER update_alert_delivery_log_updated_at
  BEFORE UPDATE ON alert_delivery_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set up row-level security (optional, for multi-tenant scenarios)
-- ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE account_balance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_audit_log ENABLE ROW LEVEL SECURITY;

-- Grant appropriate permissions
GRANT SELECT, INSERT ON transaction_ledger TO authenticated;
GRANT SELECT, INSERT ON transaction_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON account_balance TO authenticated;
GRANT SELECT, INSERT ON alert_delivery_log TO authenticated;
GRANT SELECT, INSERT ON webhook_event_history TO authenticated;
GRANT SELECT, INSERT ON exchange_rate_history TO authenticated;
