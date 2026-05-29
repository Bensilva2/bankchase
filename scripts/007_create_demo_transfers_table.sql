-- Demo Transfers Table
-- Tracks transfers of demo funds with auto-refund capabilities

CREATE TABLE IF NOT EXISTS public.demo_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  
  admin_user_id UUID REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_number TEXT NOT NULL,
  
  amount FLOAT NOT NULL,
  status TEXT DEFAULT 'pending',
  transfer_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  notes TEXT,
  org_id TEXT DEFAULT 'default'
);

CREATE INDEX IF NOT EXISTS idx_demo_transfers_admin_user_id ON public.demo_transfers(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_to_account_number ON public.demo_transfers(to_account_number);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_status ON public.demo_transfers(status);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_expires_at ON public.demo_transfers(expires_at);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_from_account_id ON public.demo_transfers(from_account_id);

-- Enable RLS
ALTER TABLE public.demo_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for demo_transfers (permissive for demo)
CREATE POLICY "demo_transfers_select_all" ON public.demo_transfers FOR SELECT USING (true);
CREATE POLICY "demo_transfers_insert_all" ON public.demo_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "demo_transfers_update_all" ON public.demo_transfers FOR UPDATE USING (true);
CREATE POLICY "demo_transfers_delete_all" ON public.demo_transfers FOR DELETE USING (true);
