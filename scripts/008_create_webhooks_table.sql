-- Webhooks Table
-- Stores webhook configurations for users/organizations

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  org_id TEXT DEFAULT 'default',
  
  url TEXT NOT NULL,
  secret BYTEA NOT NULL, -- Encrypted secret key
  events TEXT[] DEFAULT ARRAY['transfer.completed', 'transfer.pending'],
  
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_org_id ON public.webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON public.webhooks(is_active);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "webhooks_select_own" ON public.webhooks FOR SELECT 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "webhooks_insert_own" ON public.webhooks FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "webhooks_update_own" ON public.webhooks FOR UPDATE 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "webhooks_delete_own" ON public.webhooks FOR DELETE 
  USING (user_id = auth.uid() OR org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));
