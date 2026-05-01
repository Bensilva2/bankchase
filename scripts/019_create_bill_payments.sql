-- Bill Payments Table
-- Linked to bill payment automation workflow runs

CREATE TABLE IF NOT EXISTS public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  
  payee_name TEXT NOT NULL,
  payee_account TEXT NOT NULL, -- External account identifier
  
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  is_recurring BOOLEAN DEFAULT false,
  frequency TEXT, -- one_time, weekly, biweekly, monthly, quarterly, annually
  
  status TEXT DEFAULT 'scheduled', -- scheduled, pending, processing, completed, failed, retrying, cancelled
  
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  failure_reason TEXT,
  
  reference_number TEXT UNIQUE,
  notes TEXT,
  
  next_payment_date TIMESTAMP WITH TIME ZONE, -- For recurring payments
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_payments_workflow_run_id ON public.bill_payments(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_account_id ON public.bill_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON public.bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_status ON public.bill_payments(status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_scheduled_date ON public.bill_payments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bill_payments_is_recurring ON public.bill_payments(is_recurring);
CREATE INDEX IF NOT EXISTS idx_bill_payments_created_at ON public.bill_payments(created_at DESC);

-- Enable RLS
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "bill_payments_select_own" ON public.bill_payments FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "bill_payments_insert_own" ON public.bill_payments FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "bill_payments_update_own" ON public.bill_payments FOR UPDATE 
  USING (user_id = auth.uid());
