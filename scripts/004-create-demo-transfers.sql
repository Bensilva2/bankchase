-- Create demo_accounts table for admin demo money system
CREATE TABLE IF NOT EXISTS demo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  is_demo_account BOOLEAN DEFAULT TRUE,
  account_type TEXT DEFAULT 'demo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create demo_transfers table for tracking demo money transfers
CREATE TABLE IF NOT EXISTS demo_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_reference TEXT UNIQUE NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  to_account_number TEXT NOT NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, refunded
  transfer_type TEXT, -- internal, external
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_demo_accounts_account_number ON demo_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_demo_accounts_user_id ON demo_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_accounts_is_demo ON demo_accounts(is_demo_account);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_admin_user_id ON demo_transfers(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_status ON demo_transfers(status);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_expires_at ON demo_transfers(expires_at);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_to_account_number ON demo_transfers(to_account_number);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_to_user_id ON demo_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_transfer_reference ON demo_transfers(transfer_reference);

-- Enable Row Level Security
ALTER TABLE demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_accounts
CREATE POLICY "Users can read their own demo account" ON demo_accounts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own demo account" ON demo_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for demo_transfers (admins can see all, users can see their own)
CREATE POLICY "Users can read transfers to their account" ON demo_transfers
  FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = admin_user_id);

CREATE POLICY "Admins can update transfer status" ON demo_transfers
  FOR UPDATE USING (auth.uid() = admin_user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_demo_transfers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-update
DROP TRIGGER IF EXISTS update_demo_accounts_updated_at ON demo_accounts;
CREATE TRIGGER update_demo_accounts_updated_at
  BEFORE UPDATE ON demo_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_demo_transfers_updated_at ON demo_transfers;
CREATE TRIGGER update_demo_transfers_updated_at
  BEFORE UPDATE ON demo_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_transfers_updated_at();

-- Comment on tables for documentation
COMMENT ON TABLE demo_accounts IS 'Stores demo/virtual accounts for testing and sandbox mode';
COMMENT ON TABLE demo_transfers IS 'Tracks demo money transfers with auto-refund expiry';
COMMENT ON COLUMN demo_transfers.status IS 'pending: awaiting completion, completed: funds credited, refunded: expired funds returned';
COMMENT ON COLUMN demo_transfers.expires_at IS 'When pending external transfers will auto-refund (7-14 days)';
