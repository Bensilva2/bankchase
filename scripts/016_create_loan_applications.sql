-- Loan Applications Table
-- Linked to loan application workflow runs

CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  
  loan_amount DECIMAL(15, 2) NOT NULL,
  loan_term_months INTEGER NOT NULL, -- 12, 24, 36, 60
  interest_rate FLOAT,
  monthly_payment DECIMAL(15, 2),
  
  status TEXT DEFAULT 'submitted', -- submitted, kyc_pending, credit_check, offer_generated, accepted, approved, disbursed, rejected
  
  credit_score INTEGER,
  credit_check_result JSONB,
  
  offer_amount DECIMAL(15, 2),
  offer_term_months INTEGER,
  offer_interest_rate FLOAT,
  offer_expires_at TIMESTAMP WITH TIME ZONE,
  
  acceptance_date TIMESTAMP WITH TIME ZONE,
  disbursement_date TIMESTAMP WITH TIME ZONE,
  
  rejection_reason TEXT,
  rejection_date TIMESTAMP WITH TIME ZONE,
  
  documents JSONB, -- {type: url, uploaded_at}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loan_applications_workflow_run_id ON public.loan_applications(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON public.loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON public.loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON public.loan_applications(created_at DESC);

-- Enable RLS
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "loan_applications_select_own" ON public.loan_applications FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "loan_applications_insert_own" ON public.loan_applications FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "loan_applications_update_own" ON public.loan_applications FOR UPDATE 
  USING (user_id = auth.uid());
