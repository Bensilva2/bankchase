-- Users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth TEXT,
  ssn TEXT,
  profile_picture_url TEXT,
  member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier TEXT DEFAULT 'Standard',
  ultimate_rewards_points INTEGER DEFAULT 0,
  preferred_language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0,
  available_balance NUMERIC(15, 2) DEFAULT 0,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT,
  interest_rate NUMERIC(5, 3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  date TIMESTAMP NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  category TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  reference TEXT,
  fee NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payees table
CREATE TABLE IF NOT EXISTS public.payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'upcoming',
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT,
  sender TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_payees_user_id ON public.payees(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table - users can only see their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- RLS Policies for accounts - users can only see their own accounts
CREATE POLICY "Users can read own accounts" ON public.accounts
  FOR SELECT USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- Similar policies for other tables
CREATE POLICY "Users can read own transactions" ON public.transactions
  FOR SELECT USING (account_id IN (SELECT id FROM public.accounts WHERE user_id::text = auth.uid()::text) OR auth.role() = 'service_role');

CREATE POLICY "Users can read own payees" ON public.payees
  FOR SELECT USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can read own bills" ON public.bills
  FOR SELECT USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "Users can read own messages" ON public.messages
  FOR SELECT USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');
