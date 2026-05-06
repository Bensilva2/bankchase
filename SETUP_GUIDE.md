# Chase Bank - Setup Guide

## Quick Start

The "Failed to fetch" error occurs because the Supabase database tables haven't been created yet. Follow these steps:

### Step 1: Visit the Setup Page
1. Go to `/setup` in your app (e.g., `http://localhost:3000/setup`)
2. Click the **Initialize Database** button
3. Wait for confirmation that all tables were created

### Step 2: Create Your Account
1. Go to `/signup`
2. Enter your email and password
3. The system will automatically create a profile and checking account for you

### Step 3: Login
1. Go to `/login`
2. Enter your credentials
3. You should see your dashboard with your account balance

---

## What Gets Created

The setup process creates these database tables in Supabase:

| Table | Purpose |
|-------|---------|
| **profiles** | User profile information (first name, last name, roles) |
| **accounts** | Bank accounts (checking, savings) with balances |
| **transactions** | Transfer transactions between accounts |
| **demo_transfers** | Demo money for testing (auto-refunds after 7 days) |

All tables have **Row Level Security (RLS)** enabled, meaning users can only see their own data.

---

## Manual Setup (If Setup Page Fails)

If the setup page doesn't work, manually run the SQL in your Supabase dashboard:

1. Go to your Supabase dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy this SQL and paste it into the editor
5. Click **Run**

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  roles TEXT[] DEFAULT ARRAY['user'],
  demo_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT DEFAULT 'savings',
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_number TEXT NOT NULL,
  to_bank_code TEXT,
  amount NUMERIC NOT NULL,
  narration TEXT,
  reference_id TEXT UNIQUE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demo transfers table
CREATE TABLE IF NOT EXISTS public.demo_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  refund_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "accounts_select_own" ON public.accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "accounts_insert_own" ON public.accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "accounts_update_own" ON public.accounts FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (
  from_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (
  from_account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
);

CREATE POLICY "demo_transfers_select_own" ON public.demo_transfers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "demo_transfers_insert_own" ON public.demo_transfers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_demo_transfers_user_id ON public.demo_transfers(user_id);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## API Endpoints

Your app includes these endpoints for data operations:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify authentication token
- `GET /api/accounts` - Get user's accounts
- `GET /api/transactions` - Get transaction history
- `POST /api/transfers/send` - Send money transfer

All endpoints require `Authorization: Bearer {token}` header with a valid Supabase auth token.

---

## Troubleshooting

### "Failed to fetch" when logging in
- Make sure you've run the database setup first
- Check the browser console (F12) for detailed error messages

### "User not found" or "Invalid credentials"
- Make sure you've signed up first before trying to login
- Check Supabase Auth in your dashboard to see if the user was created

### Tables don't exist
- Go to `/setup` and click **Initialize Database**
- Or manually run the SQL from the Manual Setup section above

---

## Next Steps

After setup:
1. Create test accounts with different types (checking, savings)
2. Test transfers between accounts
3. Check the transactions page to see history
4. Try the demo transfer feature

Enjoy using Chase Bank!
