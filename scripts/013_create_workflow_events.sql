-- Workflow Events Table
-- Audit trail for all workflow events (steps, hooks, pauses, resumes)

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL REFERENCES public.workflow_runs(run_id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- step_started, step_completed, step_failed, hook_created, hook_received, workflow_paused, workflow_resumed
  step_name TEXT,
  
  status TEXT, -- success, failed, retrying
  input JSONB,
  output JSONB,
  
  error_message TEXT,
  duration_ms INTEGER, -- milliseconds
  
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_run_id ON public.workflow_events(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_event_type ON public.workflow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_workflow_events_step_name ON public.workflow_events(step_name);
CREATE INDEX IF NOT EXISTS idx_workflow_events_status ON public.workflow_events(status);
CREATE INDEX IF NOT EXISTS idx_workflow_events_created_at ON public.workflow_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherited from workflow_runs)
CREATE POLICY "workflow_events_select_via_runs" ON public.workflow_events FOR SELECT 
  USING (run_id IN (SELECT run_id FROM public.workflow_runs WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1)));
