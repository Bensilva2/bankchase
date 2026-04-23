-- Transaction Alerts Tables Migration
-- Creates tables for tracking and managing transaction alerts

-- Create transaction_alerts table
CREATE TABLE IF NOT EXISTS public.transaction_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in-app')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_type CHECK (type IN ('email', 'sms', 'push', 'in-app'))
);

CREATE INDEX IF NOT EXISTS idx_transaction_alerts_user_id ON public.transaction_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_transaction_id ON public.transaction_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_status ON public.transaction_alerts(status);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_type ON public.transaction_alerts(type);
CREATE INDEX IF NOT EXISTS idx_transaction_alerts_created_at ON public.transaction_alerts(created_at DESC);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  enable_email BOOLEAN DEFAULT true,
  enable_sms BOOLEAN DEFAULT false,
  enable_push BOOLEAN DEFAULT true,
  phone_number TEXT,
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Add transaction alert columns to existing notifications table if they don't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON public.notifications(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transaction_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_alerts
DO $$
BEGIN
  CREATE POLICY "Users can view their own alerts"
    ON public.transaction_alerts
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "System can insert alerts"
    ON public.transaction_alerts
    FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can update their own alerts"
    ON public.transaction_alerts
    FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- RLS Policies for notification_preferences
DO $$
BEGIN
  CREATE POLICY "Users can view their preferences"
    ON public.notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can update their preferences"
    ON public.notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE POLICY "Users can insert their preferences"
    ON public.notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END
$$;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.transaction_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
