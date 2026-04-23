-- Migration: Add Admin System and Real-Time Notifications
-- Description: Creates tables for admin transfers, device registration, and audit logs

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create admin_transfers table for tracking admin-initiated fund transfers
CREATE TABLE IF NOT EXISTS public.admin_transfers (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  recipient_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'otp_sent', 'confirmed', 'completed', 'failed', 'cancelled')),
  otp_code TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  reference_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS admin_transfers_admin_id_idx ON public.admin_transfers(admin_id);
CREATE INDEX IF NOT EXISTS admin_transfers_recipient_id_idx ON public.admin_transfers(recipient_id);
CREATE INDEX IF NOT EXISTS admin_transfers_status_idx ON public.admin_transfers(status);
CREATE INDEX IF NOT EXISTS admin_transfers_created_at_idx ON public.admin_transfers(created_at DESC);

-- Create device_registrations table for multi-device push notifications
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('web', 'mobile', 'tablet')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  push_token TEXT UNIQUE,
  sms_number TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS device_registrations_user_id_idx ON public.device_registrations(user_id);
CREATE INDEX IF NOT EXISTS device_registrations_device_id_idx ON public.device_registrations(device_id);
CREATE INDEX IF NOT EXISTS device_registrations_push_token_idx ON public.device_registrations(push_token);
CREATE INDEX IF NOT EXISTS device_registrations_is_active_idx ON public.device_registrations(is_active);

-- Create notification_log table for tracking all notifications
CREATE TABLE IF NOT EXISTS public.notification_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('push', 'sms', 'in_app', 'email')),
  title TEXT,
  message TEXT NOT NULL,
  related_transfer_id BIGINT REFERENCES public.admin_transfers(id) ON DELETE SET NULL,
  related_account_id BIGINT REFERENCES public.accounts(id) ON DELETE SET NULL,
  metadata JSONB,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  delivery_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notification_log_user_id_idx ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS notification_log_type_idx ON public.notification_log(notification_type);
CREATE INDEX IF NOT EXISTS notification_log_created_at_idx ON public.notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS notification_log_delivery_status_idx ON public.notification_log(delivery_status);

-- Create audit_log table for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id BIGINT,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_log_admin_id_idx ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.admin_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_transfers
CREATE POLICY "Admin can view own transfers as admin" ON public.admin_transfers
  FOR SELECT USING (
    auth.uid()::text::bigint = admin_id OR
    (SELECT role FROM public.users WHERE id = auth.uid()::text::bigint) = 'super_admin'
  );

CREATE POLICY "Recipients can view transfers to them" ON public.admin_transfers
  FOR SELECT USING (
    auth.uid()::text::bigint = recipient_id
  );

CREATE POLICY "Only admins can create transfers" ON public.admin_transfers
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()::text::bigint) IN ('admin', 'super_admin')
  );

-- RLS Policies for device_registrations
CREATE POLICY "Users can view own devices" ON public.device_registrations
  FOR SELECT USING (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can register devices" ON public.device_registrations
  FOR INSERT WITH CHECK (auth.uid()::text::bigint = user_id);

CREATE POLICY "Users can update own devices" ON public.device_registrations
  FOR UPDATE USING (auth.uid()::text::bigint = user_id);

-- RLS Policies for notification_log
CREATE POLICY "Users can view own notifications" ON public.notification_log
  FOR SELECT USING (auth.uid()::text::bigint = user_id);

-- RLS Policies for audit_log
CREATE POLICY "Only admins and super_admins can view audit logs" ON public.audit_log
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()::text::bigint) IN ('admin', 'super_admin')
  );
