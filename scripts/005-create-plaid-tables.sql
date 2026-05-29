-- Plaid Integration Tables
-- Tables for managing Plaid account linking, transactions, and monitoring

-- Create plaid_accounts table for linked bank accounts
CREATE TABLE IF NOT EXISTS plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL ENCRYPTED,
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  account_id VARCHAR(255),
  account_name VARCHAR(255),
  account_type VARCHAR(50),
  account_subtype VARCHAR(50),
  account_mask VARCHAR(10),
  balance_current DECIMAL(15, 2),
  balance_available DECIMAL(15, 2),
  balance_limit DECIMAL(15, 2),
  currency_code VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_account_type CHECK (account_type IN ('investment', 'credit', 'depository', 'loan', 'other'))
);

-- Create plaid_transactions table for synced transactions
CREATE TABLE IF NOT EXISTS plaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  plaid_account_id UUID NOT NULL REFERENCES plaid_accounts(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL,
  pending_transaction_id VARCHAR(255),
  amount DECIMAL(15, 2) NOT NULL,
  iso_currency_code VARCHAR(3),
  barter_exchange BOOLEAN DEFAULT FALSE,
  category_id VARCHAR(255),
  categories TEXT[] DEFAULT '{}',
  check_number VARCHAR(50),
  counterparty_id VARCHAR(255),
  counterparty_name VARCHAR(255),
  counterparty_type VARCHAR(50),
  date DATE NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE,
  authorized_date DATE,
  authorized_datetime TIMESTAMP WITH TIME ZONE,
  direction VARCHAR(10) CHECK (direction IN ('IN', 'OUT')),
  logo_url TEXT,
  merchant_name VARCHAR(255),
  merchant_entity_id VARCHAR(255),
  payment_channel VARCHAR(50),
  transaction_code VARCHAR(10),
  transaction_type VARCHAR(50),
  personal_finance_category_primary VARCHAR(255),
  personal_finance_category_detailed VARCHAR(255),
  name VARCHAR(255),
  original_description VARCHAR(255),
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plaid_link_sessions table for tracking Link flow analytics
CREATE TABLE IF NOT EXISTS plaid_link_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  link_token VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'initiated',
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  event_type VARCHAR(255),
  error_code VARCHAR(255),
  error_message TEXT,
  error_display_message TEXT,
  item_id VARCHAR(255),
  public_token VARCHAR(500),
  linked_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plaid_item_status table for debugging and monitoring item health
CREATE TABLE IF NOT EXISTS plaid_item_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL,
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  webhook_code VARCHAR(255),
  webhook_type VARCHAR(255),
  error_code VARCHAR(255),
  error_message TEXT,
  error_type VARCHAR(50),
  last_successful_webhook TIMESTAMP WITH TIME ZONE,
  last_webhook_timestamp TIMESTAMP WITH TIME ZONE,
  request_id VARCHAR(255),
  transactions_last_refreshed TIMESTAMP WITH TIME ZONE,
  item_login_required BOOLEAN DEFAULT FALSE,
  consent_expiration_time TIMESTAMP WITH TIME ZONE,
  status_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plaid_api_metrics table for usage monitoring
CREATE TABLE IF NOT EXISTS plaid_api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255),
  request_count INTEGER DEFAULT 1,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  date DATE NOT NULL,
  environment VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_user_id ON plaid_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON plaid_accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_status ON plaid_accounts(status);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_account_id ON plaid_transactions(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON plaid_transactions(date);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_merchant ON plaid_transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_plaid_link_sessions_user_id ON plaid_link_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_link_sessions_status ON plaid_link_sessions(status);
CREATE INDEX IF NOT EXISTS idx_plaid_item_status_user_id ON plaid_item_status(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_item_status_item_id ON plaid_item_status(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_api_metrics_date ON plaid_api_metrics(date);

-- Enable RLS for plaid_accounts
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own Plaid accounts" ON plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Plaid accounts" ON plaid_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Plaid accounts" ON plaid_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable RLS for plaid_transactions
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON plaid_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON plaid_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS for plaid_link_sessions
ALTER TABLE plaid_link_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own Link sessions" ON plaid_link_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Link sessions" ON plaid_link_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS for plaid_item_status
ALTER TABLE plaid_item_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own item status" ON plaid_item_status
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own item status" ON plaid_item_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);
