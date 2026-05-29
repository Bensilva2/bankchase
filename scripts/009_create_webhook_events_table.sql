-- Webhook Events Table
-- Stores triggered webhook events for auditing and retry

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- 'transfer.completed', 'transfer.pending', 'balance.updated'
  payload JSONB NOT NULL, -- Event data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Signature for verification
  signature TEXT NOT NULL -- HMAC-SHA256 signature
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_id ON public.webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - inherited from webhook ownership
CREATE POLICY "webhook_events_select_own" ON public.webhook_events FOR SELECT 
  USING (webhook_id IN (
    SELECT id FROM public.webhooks 
    WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
  ));

CREATE POLICY "webhook_events_insert_all" ON public.webhook_events FOR INSERT 
  WITH CHECK (true); -- System can insert events

CREATE POLICY "webhook_events_delete_own" ON public.webhook_events FOR DELETE 
  USING (webhook_id IN (
    SELECT id FROM public.webhooks 
    WHERE user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid())
  ));
