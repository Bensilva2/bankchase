-- Demo Money Transfer System Tables
-- Supports virtual/demo funds for testing and onboarding

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
  org_id TEXT NOT NULL DEFAULT 'default',
  
  balance FLOAT DEFAULT 0.0,
  is_demo_account BOOLEAN DEFAULT true,
  account_type TEXT DEFAULT 'demo',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_org_id ON public.accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_accounts_is_demo ON public.accounts(is_demo_account);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts (permissive for demo)
CREATE POLICY "accounts_select_all" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "accounts_insert_all" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "accounts_update_all" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "accounts_delete_all" ON public.accounts FOR DELETE USING (true);
