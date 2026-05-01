-- Workflow Runs Table
-- Stores execution history of all durable workflows

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  workflow_name TEXT NOT NULL,
  user_id UUID REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  org_id TEXT DEFAULT 'default',
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  input JSONB NOT NULL,
  output JSONB,
  
  error_message TEXT,
  error_code TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON public.workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_org_id ON public.workflow_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_name ON public.workflow_runs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON public.workflow_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_run_id ON public.workflow_runs(run_id);

-- Enable RLS
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "workflow_runs_select_own" ON public.workflow_runs FOR SELECT 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "workflow_runs_insert_own" ON public.workflow_runs FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "workflow_runs_update_own" ON public.workflow_runs FOR UPDATE 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));

CREATE POLICY "workflow_runs_delete_own" ON public.workflow_runs FOR DELETE 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1));
