-- Account Closures Table
-- Linked to account closure workflow runs

CREATE TABLE IF NOT EXISTS public.account_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'initiated', -- initiated, verified, transactions_cleared, refunds_processed, archived, completed
  
  reason TEXT, -- account_transfer, inactivity, fraud, customer_request
  close_reason_details TEXT,
  
  pending_transactions_count INTEGER DEFAULT 0,
  total_refunded DECIMAL(15, 2) DEFAULT 0,
  
  verification_completed_at TIMESTAMP WITH TIME ZONE,
  refunds_completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  archived_data JSONB, -- Account history snapshot
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_closures_workflow_run_id ON public.account_closures(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_account_closures_account_id ON public.account_closures(account_id);
CREATE INDEX IF NOT EXISTS idx_account_closures_user_id ON public.account_closures(user_id);
CREATE INDEX IF NOT EXISTS idx_account_closures_status ON public.account_closures(status);

-- Enable RLS
ALTER TABLE public.account_closures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "account_closures_select_own" ON public.account_closures FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "account_closures_insert_own" ON public.account_closures FOR INSERT 
  WITH CHECK (user_id = auth.uid());
