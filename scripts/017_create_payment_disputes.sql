-- Payment Disputes Table
-- Linked to dispute workflow runs

CREATE TABLE IF NOT EXISTS public.payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  
  disputed_amount DECIMAL(15, 2) NOT NULL,
  dispute_reason TEXT NOT NULL, -- unauthorized, duplicate, amount_mismatch, refund_not_received, quality_issue
  
  status TEXT DEFAULT 'submitted', -- submitted, under_investigation, evidence_requested, evidence_received, resolved, closed
  
  merchant_name TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE,
  
  evidence_files JSONB, -- [{type, url, uploaded_at}]
  merchant_response TEXT,
  merchant_evidence JSONB,
  
  chargeback_initiated_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  resolution TEXT, -- approved, rejected, partial
  refund_amount DECIMAL(15, 2),
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_workflow_run_id ON public.payment_disputes(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON public.payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON public.payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON public.payment_disputes(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "payment_disputes_select_own" ON public.payment_disputes FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "payment_disputes_insert_own" ON public.payment_disputes FOR INSERT 
  WITH CHECK (user_id = auth.uid());
