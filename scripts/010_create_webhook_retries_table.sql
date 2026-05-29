-- Webhook Retries Table
-- Tracks failed webhook delivery attempts with exponential backoff

CREATE TABLE IF NOT EXISTS public.webhook_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_event_id UUID REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending', 'failed', 'success', 'expired'
  
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_retries_webhook_event_id ON public.webhook_retries(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_retries_status ON public.webhook_retries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_retries_next_retry_at ON public.webhook_retries(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_webhook_retries_created_at ON public.webhook_retries(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_retries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - inherited from webhook_event -> webhook ownership
CREATE POLICY "webhook_retries_select_own" ON public.webhook_retries FOR SELECT 
  USING (webhook_event_id IN (
    SELECT id FROM public.webhook_events 
    WHERE webhook_id IN (
      SELECT id FROM public.webhooks 
      WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
    )
  ));

CREATE POLICY "webhook_retries_insert_all" ON public.webhook_retries FOR INSERT 
  WITH CHECK (true); -- System can insert retries

CREATE POLICY "webhook_retries_update_all" ON public.webhook_retries FOR UPDATE 
  USING (true); -- System can update retries

CREATE POLICY "webhook_retries_delete_own" ON public.webhook_retries FOR DELETE 
  USING (webhook_event_id IN (
    SELECT id FROM public.webhook_events 
    WHERE webhook_id IN (
      SELECT id FROM public.webhooks 
      WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
    )
  ));
