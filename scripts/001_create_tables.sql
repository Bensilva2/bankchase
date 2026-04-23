-- ============================================
-- Chase Banking App - Full Database Schema
-- ============================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,
  backup_codes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (true);

-- 2. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Checking Account',
  account_type TEXT NOT NULL DEFAULT 'checking',
  account_number TEXT,
  full_account_number TEXT,
  routing_number TEXT DEFAULT '021000021',
  balance NUMERIC(15,2) DEFAULT 0.00,
  available_balance NUMERIC(15,2) DEFAULT 0.00,
  interest_rate NUMERIC(6,4) DEFAULT 0.01,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_read" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (true);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'debit',
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'completed',
  reference TEXT,
  fee NUMERIC(10,2) DEFAULT 0,
  recipient_id TEXT,
  recipient_bank TEXT,
  recipient_account TEXT,
  recipient_name TEXT,
  sender_name TEXT,
  scheduled_date TIMESTAMPTZ,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  settlement_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_read" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (true);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (true);

-- 5. CREDIT SCORES TABLE
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 750,
  status TEXT DEFAULT 'good',
  trend TEXT DEFAULT 'stable',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_scores_read" ON public.credit_scores FOR SELECT USING (true);
CREATE POLICY "credit_scores_insert" ON public.credit_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "credit_scores_update" ON public.credit_scores FOR UPDATE USING (true);

-- 6. WIRE TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS public.wire_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  recipient_name TEXT,
  recipient_bank TEXT,
  recipient_routing_number TEXT,
  recipient_account_number TEXT,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wire_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wire_transfers_read" ON public.wire_transfers FOR SELECT USING (true);
CREATE POLICY "wire_transfers_insert" ON public.wire_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "wire_transfers_update" ON public.wire_transfers FOR UPDATE USING (true);

-- 7. ZELLE TRANSFERS TABLE
CREATE TABLE IF NOT EXISTS public.zelle_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.zelle_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zelle_transfers_read" ON public.zelle_transfers FOR SELECT USING (true);
CREATE POLICY "zelle_transfers_insert" ON public.zelle_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "zelle_transfers_update" ON public.zelle_transfers FOR UPDATE USING (true);

-- 8. BILL PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  payee TEXT NOT NULL,
  due_date DATE,
  scheduled_date DATE,
  frequency TEXT DEFAULT 'once',
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bill_payments_read" ON public.bill_payments FOR SELECT USING (true);
CREATE POLICY "bill_payments_insert" ON public.bill_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "bill_payments_update" ON public.bill_payments FOR UPDATE USING (true);

-- 9. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  transaction_alerts BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  offer_notifications BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_prefs_read" ON public.notification_preferences FOR SELECT USING (true);
CREATE POLICY "notification_prefs_insert" ON public.notification_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "notification_prefs_update" ON public.notification_preferences FOR UPDATE USING (true);

-- 10. LOGIN HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device TEXT,
  location TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_history_read" ON public.login_history FOR SELECT USING (true);
CREATE POLICY "login_history_insert" ON public.login_history FOR INSERT WITH CHECK (true);

-- 11. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'English',
  currency TEXT DEFAULT 'USD',
  biometric_login BOOLEAN DEFAULT FALSE,
  two_factor_method TEXT DEFAULT 'sms',
  session_timeout INTEGER DEFAULT 15,
  settings_data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings_read" ON public.user_settings FOR SELECT USING (true);
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE USING (true);

-- 12. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON public.bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_wire_transfers_user_id ON public.wire_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_zelle_transfers_user_id ON public.zelle_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
