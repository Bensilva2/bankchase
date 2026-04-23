-- Create banking schema for Chase-like functionality
-- This migration sets up all tables for user accounts, transactions, bills, and real-time features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  ssn_last_four TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  profile_picture_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'America/Chicago',
  currency TEXT DEFAULT 'USD',
  customer_tier TEXT DEFAULT 'standard', -- standard, silver, gold, platinum
  ultimate_rewards_points INTEGER DEFAULT 0,
  member_since TIMESTAMP DEFAULT NOW(),
  identity_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_method TEXT, -- sms, email, app
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Bank accounts
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL, -- checking, savings, money_market
  account_name TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT NOT NULL DEFAULT '021000021', -- Chase routing
  swift_code TEXT DEFAULT 'CHASUS33', -- Chase SWIFT code
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  interest_rate DECIMAL(5,4) DEFAULT 0,
  last_interest_posted DATE,
  status TEXT DEFAULT 'active', -- active, frozen, closed
  is_external BOOLEAN DEFAULT FALSE,
  external_bank_name TEXT,
  external_routing_number TEXT,
  daily_withdrawal_limit DECIMAL(15,2) DEFAULT 10000,
  daily_transfer_limit DECIMAL(15,2) DEFAULT 100000,
  monthly_transaction_limit INTEGER DEFAULT 6, -- For savings accounts
  opened_date TIMESTAMP DEFAULT NOW(),
  closed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- transfer_sent, transfer_received, wire_sent, wire_received, 
                                   -- check_deposit, withdrawal, deposit, payment, fee, interest
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, completed, failed, reversed
  description TEXT,
  reference_number TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  receipt_url TEXT,
  
  -- Transfer details
  recipient_name TEXT,
  recipient_account_id UUID REFERENCES public.accounts(id),
  recipient_bank_name TEXT,
  recipient_routing_number TEXT,
  recipient_account_number TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  
  -- Sender details (for received transfers)
  sender_name TEXT,
  sender_account_id UUID REFERENCES public.accounts(id),
  sender_bank_name TEXT,
  sender_routing_number TEXT,
  
  -- Wire details
  wire_instruction_id TEXT,
  swift_code TEXT,
  intermediary_bank TEXT,
  
  -- Zelle details
  zelle_id TEXT,
  
  -- Check deposit details
  check_image_url TEXT,
  check_number TEXT,
  
  -- Category for analytics
  category TEXT, -- utilities, groceries, healthcare, etc.
  
  -- Dispute tracking
  is_disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  dispute_status TEXT, -- open, closed, resolved
  dispute_filed_date TIMESTAMP,
  
  posted_date TIMESTAMP,
  transaction_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  payee_name TEXT NOT NULL,
  payee_account_number TEXT,
  payee_routing_number TEXT,
  payee_phone TEXT,
  payee_email TEXT,
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  scheduled_payment_date DATE,
  payment_status TEXT DEFAULT 'scheduled', -- scheduled, sent, paid, failed, cancelled
  frequency TEXT, -- one_time, weekly, biweekly, monthly, quarterly, annually
  next_payment_date DATE,
  last_payment_date TIMESTAMP,
  payment_history JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- transaction, security, alert, promotion, update
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  priority TEXT DEFAULT 'normal', -- low, normal, high, critical
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts and fraud detection
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- spending, security, verification, limit
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- info, warning, critical
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  action_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings and preferences
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notifications preferences
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  transaction_alerts BOOLEAN DEFAULT TRUE,
  security_alerts BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT FALSE,
  
  -- Security preferences
  biometric_login ENABLED BOOLEAN DEFAULT FALSE,
  face_id_enabled BOOLEAN DEFAULT FALSE,
  touch_id_enabled BOOLEAN DEFAULT FALSE,
  
  -- Display preferences
  theme TEXT DEFAULT 'light', -- light, dark, auto
  show_account_numbers BOOLEAN DEFAULT TRUE,
  
  -- Spending limits
  daily_spending_limit DECIMAL(15,2),
  weekly_spending_limit DECIMAL(15,2),
  monthly_spending_limit DECIMAL(15,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Device tracking for security
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT, -- mobile, desktop, tablet
  device_id TEXT UNIQUE,
  ip_address INET,
  user_agent TEXT,
  is_trusted BOOLEAN DEFAULT FALSE,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Login history for security
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ip_address INET,
  device_type TEXT,
  location TEXT,
  login_method TEXT, -- password, biometric, sso
  success BOOLEAN,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_bills_user_id ON public.bills(user_id);
CREATE INDEX idx_bills_due_date ON public.bills(due_date);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Accounts: Users can only see/update their own accounts
CREATE POLICY "Users can view their own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: Users can view transactions for their accounts
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
  );

-- Transactions: Users can create transactions (through API)
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
  );

-- Bills: Users can manage their own bills
CREATE POLICY "Users can view their bills" ON public.bills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage bills" ON public.bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can view and update their notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Alerts: Users can view their alerts
CREATE POLICY "Users can view their alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Settings: Users can manage their own settings
CREATE POLICY "Users can view their settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for real-time features
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Publish new transactions to realtime channel
CREATE OR REPLACE FUNCTION public.publish_transaction_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'transactions:' || NEW.account_id::text,
    json_build_object('id', NEW.id, 'status', NEW.status, 'amount', NEW.amount)::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_notification AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.publish_transaction_notification();
