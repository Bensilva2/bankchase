-- Banking Application Database Schema
-- Creates users, accounts, transactions, notifications, admin_transfers, and related tables

-- Drop existing tables if they exist (in correct order for FK constraints)
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.device_registrations CASCADE;
DROP TABLE IF EXISTS public.admin_transfers CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  two_factor_enabled BOOLEAN DEFAULT false,
  totp_secret TEXT,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);

-- 2. Accounts table  
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Checking Account',
  account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'money_market', 'credit')),
  account_number TEXT NOT NULL,
  full_account_number TEXT NOT NULL,
  routing_number TEXT DEFAULT '021000021',
  balance NUMERIC(15,2) DEFAULT 0.00,
  available_balance NUMERIC(15,2) DEFAULT 0.00,
  interest_rate NUMERIC(5,4) DEFAULT 0.0000,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_number ON public.accounts(account_number);

-- 3. Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'deposit', 'withdrawal', 'transfer')),
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  transaction_date TIMESTAMPTZ DEFAULT now(),
  settlement_date TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- 4. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'alert', 'credit', 'debit', 'account', 'security')),
  is_read BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- 5. Admin Transfers table
CREATE TABLE public.admin_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending_otp' CHECK (status IN ('pending_otp', 'pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_transfers_user_id ON public.admin_transfers(user_id);
CREATE INDEX idx_admin_transfers_status ON public.admin_transfers(status);

-- 6. Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 7. Device Registrations table
CREATE TABLE public.device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'android', 'ios')),
  device_name TEXT,
  fcm_token TEXT,
  apns_token TEXT,
  push_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_device_user_id ON public.device_registrations(user_id);

-- 8. Notification Logs table
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT,
  type TEXT DEFAULT 'push',
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Bill Payments table (referenced by dashboard API)
CREATE TABLE public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payee TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Credit Scores table (referenced by dashboard API)
CREATE TABLE public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 750,
  status TEXT DEFAULT 'good',
  trend TEXT DEFAULT 'stable',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow service role full access (API routes use service role key via server client)
-- For the custom auth system, we use permissive policies since auth is handled at the API level

CREATE POLICY "Allow all for service role" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.admin_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.device_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.bill_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON public.credit_scores FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_transfers;
