-- Wise API Integration Schema

-- Create wise_transfers table to track all transfer operations
CREATE TABLE IF NOT EXISTS wise_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Wise identifiers
  wise_transfer_id VARCHAR(255) UNIQUE NOT NULL,
  wise_quote_uuid VARCHAR(255) NOT NULL,
  
  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id VARCHAR(255),
  
  -- Transfer details
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  source_amount DECIMAL(15, 2) NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  exchange_rate DECIMAL(15, 8) NOT NULL,
  fee_amount DECIMAL(15, 2),
  
  -- Recipient information
  recipient_account_id VARCHAR(255) NOT NULL,
  recipient_account_number VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_bank VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  previous_status VARCHAR(50),
  
  -- Idempotency
  customer_transaction_id VARCHAR(255) UNIQUE,
  
  -- Payment details
  funded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Error tracking
  error_code VARCHAR(255),
  error_message TEXT,
  last_error_details JSONB,
  
  -- Metadata
  metadata JSONB,
  webhook_events JSONB[] DEFAULT ARRAY[]::JSONB[],
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_wise_transfer_id (wise_transfer_id),
  INDEX idx_customer_transaction_id (customer_transaction_id)
);

-- Create wise_quotes table to cache quote information
CREATE TABLE IF NOT EXISTS wise_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Wise identifiers
  wise_quote_uuid VARCHAR(255) UNIQUE NOT NULL,
  
  -- Quote details
  source_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  source_amount DECIMAL(15, 2),
  target_amount DECIMAL(15, 2),
  exchange_rate DECIMAL(15, 8) NOT NULL,
  fee_amount DECIMAL(15, 2) NOT NULL,
  recipient_fee DECIMAL(15, 2),
  
  -- Valid for
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  INDEX idx_wise_quote_uuid (wise_quote_uuid),
  INDEX idx_valid_until (valid_until)
);

-- Create wise_recipients table to cache recipient information
CREATE TABLE IF NOT EXISTS wise_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Wise identifiers
  wise_recipient_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Recipient details
  account_holder_name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  account_number VARCHAR(255),
  account_type VARCHAR(50),
  bank_code VARCHAR(50),
  bank_name VARCHAR(255),
  
  -- Bank details (stored as JSON for flexibility across different corridors)
  bank_details JSONB NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  metadata JSONB,
  
  INDEX idx_user_id (user_id),
  INDEX idx_wise_recipient_id (wise_recipient_id),
  INDEX idx_currency (currency)
);

-- Create wise_webhooks table to track webhook deliveries
CREATE TABLE IF NOT EXISTS wise_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Webhook metadata
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  occurred_at TIMESTAMP WITH TIME ZONE,
  
  -- Related resources
  wise_transfer_id VARCHAR(255),
  user_id UUID,
  
  -- Payload
  event_data JSONB NOT NULL,
  
  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_error TEXT,
  
  INDEX idx_event_id (event_id),
  INDEX idx_event_type (event_type),
  INDEX idx_wise_transfer_id (wise_transfer_id),
  INDEX idx_user_id (user_id),
  INDEX idx_processed_at (processed_at)
);

-- Create wise_api_logs table for debugging
CREATE TABLE IF NOT EXISTS wise_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request details
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  
  -- Request/Response
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  
  -- Timing
  duration_ms INTEGER,
  
  -- Error tracking
  error_message TEXT,
  
  -- Related resources
  user_id UUID,
  wise_transfer_id VARCHAR(255),
  
  INDEX idx_user_id (user_id),
  INDEX idx_endpoint (endpoint),
  INDEX idx_created_at (created_at)
);

-- Add RLS policies
ALTER TABLE wise_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wise_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wise_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wise_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wise_api_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own transfers
CREATE POLICY "Users can view own transfers" 
  ON wise_transfers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers" 
  ON wise_transfers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfers" 
  ON wise_transfers FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only see their own recipients
CREATE POLICY "Users can view own recipients" 
  ON wise_recipients FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipients" 
  ON wise_recipients FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipients" 
  ON wise_recipients FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes on updated_at for optimistic locking
CREATE INDEX idx_wise_transfers_updated_at ON wise_transfers(updated_at);
CREATE INDEX idx_wise_quotes_updated_at ON wise_quotes(updated_at);
