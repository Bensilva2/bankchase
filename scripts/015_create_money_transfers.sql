-- Money Transfers Table
-- Linked to transfer workflow runs for domain-specific data

CREATE TABLE IF NOT EXISTS public.money_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  status TEXT DEFAULT 'pending', -- pending, validating, fraud_check, processing, completed, failed, reversed
  
  fraud_score FLOAT,
  fraud_reason TEXT,
  
  reference_number TEXT UNIQUE,
  notes TEXT,
  
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_money_transfers_workflow_run_id ON public.money_transfers(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_money_transfers_from_account ON public.money_transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_money_transfers_to_account ON public.money_transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_money_transfers_status ON public.money_transfers(status);
CREATE INDEX IF NOT EXISTS idx_money_transfers_created_at ON public.money_transfers(created_at DESC);

-- Enable RLS
ALTER TABLE public.money_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "money_transfers_select_own" ON public.money_transfers FOR SELECT 
  USING (from_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

CREATE POLICY "money_transfers_insert_own" ON public.money_transfers FOR INSERT 
  WITH CHECK (from_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));
