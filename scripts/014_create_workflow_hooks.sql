-- Workflow Hooks Table
-- Stores hook tokens and resumption payloads for paused workflows

CREATE TABLE IF NOT EXISTS public.workflow_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.workflow_runs(run_id) ON DELETE CASCADE,
  
  token TEXT NOT NULL UNIQUE,
  hook_type TEXT NOT NULL, -- approval, upload, payment, kyc_verification, document_collection
  
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending', -- pending, received, expired
  
  resume_payload JSONB,
  metadata JSONB, -- Additional context (approval_type, expected_data, etc)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_hooks_run_id ON public.workflow_hooks(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_hooks_token ON public.workflow_hooks(token);
CREATE INDEX IF NOT EXISTS idx_workflow_hooks_status ON public.workflow_hooks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_hooks_hook_type ON public.workflow_hooks(hook_type);
CREATE INDEX IF NOT EXISTS idx_workflow_hooks_is_active ON public.workflow_hooks(is_active);

-- Enable RLS
ALTER TABLE public.workflow_hooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "workflow_hooks_select_via_runs" ON public.workflow_hooks FOR SELECT 
  USING (run_id IN (SELECT run_id FROM public.workflow_runs WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1)));
