-- Account Openings Table
-- Linked to account opening workflow runs with KYC tracking

CREATE TABLE IF NOT EXISTS public.account_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'initiated', -- initiated, kyc_pending, kyc_verified, documents_requested, documents_received, approved, account_created, completed, rejected
  
  account_type TEXT DEFAULT 'checking', -- checking, savings, money_market
  
  -- KYC Information
  kyc_status TEXT DEFAULT 'pending', -- pending, verified, rejected, manual_review
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_rejection_reason TEXT,
  
  -- Documents
  documents_requested_at TIMESTAMP WITH TIME ZONE,
  documents JSONB, -- [{type: 'id', 'address_proof', 'income_proof', url, uploaded_at, verified}]
  
  -- Approval
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT, -- admin user or system
  
  -- Account Creation
  account_created_at TIMESTAMP WITH TIME ZONE,
  account_number TEXT,
  
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  phone_number TEXT,
  email TEXT,
  
  metadata JSONB, -- Additional KYC data, risk scores, etc
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_openings_workflow_run_id ON public.account_openings(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_account_openings_user_id ON public.account_openings(user_id);
CREATE INDEX IF NOT EXISTS idx_account_openings_status ON public.account_openings(status);
CREATE INDEX IF NOT EXISTS idx_account_openings_kyc_status ON public.account_openings(kyc_status);
CREATE INDEX IF NOT EXISTS idx_account_openings_created_at ON public.account_openings(created_at DESC);

-- Enable RLS
ALTER TABLE public.account_openings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "account_openings_select_own" ON public.account_openings FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "account_openings_insert_own" ON public.account_openings FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "account_openings_update_own" ON public.account_openings FOR UPDATE 
  USING (user_id = auth.uid());
