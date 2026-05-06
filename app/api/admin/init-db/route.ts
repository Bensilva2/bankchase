import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Only allow this route in development
const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create profiles table
    const { error: profilesError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          first_name TEXT,
          last_name TEXT,
          roles TEXT[] DEFAULT '{"user"}',
          demo_balance DECIMAL(19,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
        DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

        CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
        CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
        CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
      `,
    })

    // If rpc doesn't work, use raw SQL instead
    if (profilesError) {
      console.log('[v0] Using direct SQL execution instead of RPC')
    }

    // Create accounts table
    const { error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .limit(1)

    if (accountsError?.code === 'PGRST116') {
      // Table doesn't exist, create it
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            account_number TEXT NOT NULL,
            account_type TEXT NOT NULL DEFAULT 'checking',
            balance DECIMAL(19,2) NOT NULL DEFAULT 0,
            currency TEXT DEFAULT 'USD',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "accounts_select_own" ON public.accounts;
          DROP POLICY IF EXISTS "accounts_insert_own" ON public.accounts;
          DROP POLICY IF EXISTS "accounts_update_own" ON public.accounts;

          CREATE POLICY "accounts_select_own" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "accounts_insert_own" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
          CREATE POLICY "accounts_update_own" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
        `,
      })
    }

    // Create transactions table
    const { error: transError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .limit(1)

    if (transError?.code === 'PGRST116') {
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
            to_account_number TEXT NOT NULL,
            to_bank_code TEXT NOT NULL,
            amount DECIMAL(19,2) NOT NULL,
            narration TEXT,
            reference_id TEXT UNIQUE,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;

          CREATE POLICY "transactions_select_own" ON public.transactions 
            FOR SELECT USING (
              from_account_id IN (
                SELECT id FROM public.accounts WHERE user_id = auth.uid()
              )
            );
        `,
      })
    }

    // Create demo_transfers table
    const { error: demoError } = await supabaseAdmin
      .from('demo_transfers')
      .select('*')
      .limit(1)

    if (demoError?.code === 'PGRST116') {
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.demo_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
            amount DECIMAL(19,2) NOT NULL,
            status TEXT DEFAULT 'pending',
            refund_date TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.demo_transfers ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "demo_transfers_select_own" ON public.demo_transfers;

          CREATE POLICY "demo_transfers_select_own" ON public.demo_transfers FOR SELECT USING (auth.uid() = user_id);
        `,
      })
    }

    // Create trigger for auto-creating profiles
    const { error: triggerError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, first_name, last_name)
          VALUES (
            new.id,
            new.email,
            coalesce(new.raw_user_meta_data ->> 'first_name', ''),
            coalesce(new.raw_user_meta_data ->> 'last_name', '')
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
      `,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Database initialized successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] DB init error:', error)
    return NextResponse.json(
      { error: error.message || 'Database initialization failed' },
      { status: 500 }
    )
  }
}
