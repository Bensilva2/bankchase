-- Create demo_accounts table
CREATE TABLE IF NOT EXISTS demo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID NOT NULL,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  is_demo_account BOOLEAN DEFAULT true,
  account_type VARCHAR(50) DEFAULT 'demo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demo_accounts_user_id ON demo_accounts(user_id);
CREATE INDEX idx_demo_accounts_org_id ON demo_accounts(org_id);
CREATE INDEX idx_demo_accounts_account_number ON demo_accounts(account_number);

-- Create demo_transfers table
CREATE TABLE IF NOT EXISTS demo_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id VARCHAR(100) UNIQUE NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES demo_accounts(id) ON DELETE CASCADE,
  to_account_number VARCHAR(20) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  transfer_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX idx_demo_transfers_admin_user_id ON demo_transfers(admin_user_id);
CREATE INDEX idx_demo_transfers_to_account_number ON demo_transfers(to_account_number);
CREATE INDEX idx_demo_transfers_status ON demo_transfers(status);
CREATE INDEX idx_demo_transfers_expires_at ON demo_transfers(expires_at);
CREATE INDEX idx_demo_transfers_from_account_id ON demo_transfers(from_account_id);

-- Create demo_transfer_audit table for compliance
CREATE TABLE IF NOT EXISTS demo_transfer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES demo_transfers(id) ON DELETE CASCADE,
  action VARCHAR(100),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demo_transfer_audit_transfer_id ON demo_transfer_audit(transfer_id);
